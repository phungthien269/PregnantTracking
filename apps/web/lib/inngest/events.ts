// ===========================================================================
// events.ts — định nghĩa event + handler Inngest (subagent #5, Phase 3).
// Mỗi loại reminder có: payload schema (Zod) + handler (payload → thông báo
// tiếng Việt). Khi nối Inngest thật (có INGEST_KEY), đăng ký handler thành
// Inngest function; hiện tại engine gọi trực tiếp qua seam HTTP.
// ===========================================================================

import { z } from 'zod'
import {
  appointmentTypeSchema,
  notificationChannelSchema,
  reminderFrequencySchema,
  type AppointmentType,
} from '@mevabe/domain'
import { APPOINTMENT_LABELS } from '@/lib/labels'
import type { NotificationMessage } from './client'

const channelSchema = notificationChannelSchema

export const appointmentReminderSchema = z.object({
  appointmentId: z.string(),
  type: appointmentTypeSchema,
  scheduledAt: z.string(),
  location: z.string().nullable(),
  doctor: z.string().nullable(),
  channel: channelSchema,
})
export type AppointmentReminderPayload = z.infer<typeof appointmentReminderSchema>

export const taskDueSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  dueDate: z.string(),
  assigneeId: z.string().nullable(),
  channel: channelSchema,
})
export type TaskDuePayload = z.infer<typeof taskDueSchema>

export const milestoneWeekSchema = z.object({
  week: z.number().int().min(1).max(42),
  dueDate: z.string(),
  channel: channelSchema,
})
export type MilestoneWeekPayload = z.infer<typeof milestoneWeekSchema>

export const reminderDueSchema = z.object({
  reminderId: z.string(),
  title: z.string(),
  scheduledAt: z.string(),
  frequency: reminderFrequencySchema,
  channel: channelSchema,
})
export type ReminderDuePayload = z.infer<typeof reminderDueSchema>

/** HH:mm theo giờ VN (ADR-006). */
function hhmm(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/** Handler: nhắc lịch khám. */
export function handleAppointmentReminder(p: AppointmentReminderPayload): NotificationMessage {
  const v = appointmentReminderSchema.parse(p)
  const label = APPOINTMENT_LABELS[v.type as AppointmentType]
  const loc = v.location ? ` tại ${v.location}` : ''
  const doc = v.doctor ? ` — BS ${v.doctor}` : ''
  return {
    id: `appointment:${v.appointmentId}`,
    kind: 'appointment',
    title: 'Nhắc lịch khám thai',
    detail: `Hôm nay lúc ${hhmm(v.scheduledAt)} mẹ có lịch ${label}${loc}.${doc}`,
    channel: v.channel,
    due: v.scheduledAt,
  }
}

/** Handler: task đến hạn hôm nay. */
export function handleTaskDue(p: TaskDuePayload): NotificationMessage {
  const v = taskDueSchema.parse(p)
  return {
    id: `task:${v.taskId}`,
    kind: 'task',
    title: 'Việc đến hạn hôm nay',
    detail: `Đến hạn ${v.dueDate}: ${v.title}`,
    channel: v.channel,
    due: v.dueDate,
  }
}

/** Handler: mốc tuần thai. */
export function handleMilestoneWeek(p: MilestoneWeekPayload): NotificationMessage {
  const v = milestoneWeekSchema.parse(p)
  return {
    id: `milestone:${v.week}`,
    kind: 'milestone',
    title: `Mẹ bước sang tuần ${v.week}`,
    detail: `Chúc mừng mẹ! Thai kỳ đã sang tuần thứ ${v.week}. Nhớ theo dõi dinh dưỡng và lịch khám.`,
    channel: v.channel,
    due: v.dueDate,
  }
}

/** Handler: nhắc lặp theo lịch (vitamin, tiêm chủng…). */
export function handleReminderDue(p: ReminderDuePayload): NotificationMessage {
  const v = reminderDueSchema.parse(p)
  const freqLabel: Record<string, string> = {
    once: 'một lần',
    daily: 'hằng ngày',
    weekly: 'mỗi tuần',
    monthly: 'mỗi tháng',
    custom: 'theo lịch',
  }
  return {
    id: `reminder:${v.reminderId}`,
    kind: 'reminder',
    title: v.title,
    detail: `Nhắc ${freqLabel[v.frequency] ?? v.frequency} — hôm nay`,
    channel: v.channel,
    due: v.scheduledAt,
  }
}
