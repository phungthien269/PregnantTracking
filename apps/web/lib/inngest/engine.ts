// ===========================================================================
// engine.ts — quét dữ liệu đến hạn hôm nay (theo Asia/Ho_Chi_Minh) và gửi
// thông báo qua Inngest. Nguồn: reminder lịch, lịch khám, task đến hạn,
// mốc tuần thai.
// - Có INGEST_KEY + INGEST_URL → POST event Inngest thật.
// - Không có key → fallback hộp thư in-app (route + notification-due vẫn
//   hoạt động đầy đủ).
// Tái dùng lib/notification-due.ts (logic ngày thuần, có self-check).
// ===========================================================================

import type * as D from '@mevabe/domain'
import { data } from '@/lib/data'
import { sendEmail } from '@/lib/notify/email'
import { currentUserEmail, currentUserId } from '@/lib/notify/recipient'
import { sendPushToUser, pushConfigured } from '@/lib/notify/push'
import { todayStr } from '@/lib/format'
import {
  hcmParts,
  isDueToday,
  isAppointmentToday,
  isTaskDueToday,
  newWeekStarted,
  weekNow,
} from '@/lib/notification-due'
import {
  handleAppointmentReminder,
  handleMilestoneWeek,
  handleReminderDue,
  handleTaskDue,
} from './events'
import { notifyClient, type Channel, type NotificationMessage } from './client'

/** Nhóm notification_preferences tương ứng từng loại reminder. */
const KIND_GROUP: Record<NotificationMessage['kind'], D.NotificationGroup> = {
  appointment: 'appointments',
  task: 'tasks',
  reminder: 'reminders',
  milestone: 'growth',
}

function channelEnabled(
  prefs: D.NotificationPreference[],
  group: D.NotificationGroup,
  ch: Channel,
): boolean {
  const p = prefs.find((x) => x.group === group && x.channel === ch)
  // Mặc định: chỉ in_app. Bật rõ email/push trong cài đặt thì mới gửi.
  return p ? p.enabled : ch === 'in_app'
}

function enabledChannels(
  prefs: D.NotificationPreference[],
  group: D.NotificationGroup,
): Channel[] {
  return (['in_app', 'email', 'push'] as const).filter((ch) => channelEnabled(prefs, group, ch))
}

/** Quét dữ liệu → các thông báo đến hạn hôm nay (chưa gửi). */
export async function collectDueNotifications(): Promise<NotificationMessage[]> {
  const today = todayStr()
  const todayParts = hcmParts(new Date().toISOString())
  const [reminders, appointments, tasks, pregnancy, prefs] = await Promise.all([
    data.getReminders(),
    data.getAppointments(),
    data.getTasks(),
    data.getPregnancy().catch(() => null),
    data.getNotificationPreferences().catch(() => []),
  ])

  const out: NotificationMessage[] = []

  // 1. Reminder theo lịch (vitamin, tiêm chủng…) — tái dùng notification-due.
  for (const r of reminders) {
    if (!r.active) continue
    if (!isDueToday(r.scheduled_at, r.frequency, today, todayParts)) continue
    for (const channel of enabledChannels(prefs, KIND_GROUP.reminder)) {
      if (!r.channels.includes(channel)) continue
      out.push(
        handleReminderDue({
          reminderId: r.id,
          title: r.title,
          scheduledAt: r.scheduled_at,
          frequency: r.frequency,
          channel,
        }),
      )
    }
  }

  // 2. Lịch khám hôm nay.
  for (const a of appointments) {
    if (!isAppointmentToday(a.scheduled_at, today)) continue
    for (const channel of enabledChannels(prefs, KIND_GROUP.appointment)) {
      out.push(
        handleAppointmentReminder({
          appointmentId: a.id,
          type: a.type,
          scheduledAt: a.scheduled_at,
          location: a.location,
          doctor: a.doctor,
          channel,
        }),
      )
    }
  }

  // 3. Task đến hạn hôm nay (chưa hoàn thành/huỷ).
  for (const t of tasks) {
    if (t.status === 'done' || t.status === 'cancelled') continue
    if (!isTaskDueToday(t.due_date, today)) continue
    for (const channel of enabledChannels(prefs, KIND_GROUP.task)) {
      out.push(
        handleTaskDue({
          taskId: t.id,
          title: t.title,
          dueDate: t.due_date ?? today,
          assigneeId: t.assignee_id,
          channel,
        }),
      )
    }
  }

  // 4. Mốc tuần thai: hôm nay bắt đầu tuần mới (so với hôm qua).
  if (pregnancy?.lmp && newWeekStarted(pregnancy.lmp, today)) {
    const week = weekNow(pregnancy.lmp, today)
    for (const channel of enabledChannels(prefs, KIND_GROUP.milestone)) {
      out.push(handleMilestoneWeek({ week, dueDate: today, channel }))
    }
  }

  return out
}

/** Gửi toàn bộ thông báo đến hạn hôm nay; trả danh sách đã gửi.
 *  R-notify: in_app/push → hộp thư in-app (push thật sẽ nối Web Push sau);
 *  email → GOM 1 EMAIL gửi thật qua Resend cho user hiện tại (thiếu key → bỏ qua). */
export async function runDueNotifications(): Promise<NotificationMessage[]> {
  const due = await collectDueNotifications()
  const pushMsgs = due.filter((m) => m.channel === 'push')
  const inApp = due.filter((m) => m.channel === 'in_app')
  const emails = due.filter((m) => m.channel === 'email')

  // Web Push: gửi tới TẤT CẢ thiết bị của user (pushConfigured → web-push; thiếu → in-app).
  if (pushMsgs.length) {
    const uid = await currentUserId()
    if (uid && pushConfigured()) {
      const r = await sendPushToUser(uid, {
        title: pushMsgs[0]!.title,
        body: pushMsgs.map((m) => m.title).slice(0, 5).join(' · '),
        url: '/dashboard',
      })
      console.log(`[notify] push gửi ${r.sent}, huỷ ${r.removed} endpoint chết`)
    } else {
      await Promise.all(pushMsgs.map((m) => notifyClient.send(m)))
    }
  }

  await Promise.all(inApp.map((m) => notifyClient.send(m)))
  if (emails.length) {
    const to = await currentUserEmail()
    if (to) {
      const lines = emails
        .map((m) => `• ${m.title}${m.detail ? ` — ${m.detail}` : ''}`)
        .join('\n')
      const result = await sendEmail({
        to,
        subject: `Mẹ & Bé — ${emails.length} nhắc đến hạn hôm nay`,
        text: `Các nhắc đến hạn hôm nay:\n\n${lines}\n\n— Ứng dụng Mẹ & Bé`,
      })
      if (!result.sent) console.warn('[notify] email chưa gửi:', result.reason)
    }
  }
  return due
}
