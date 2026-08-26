// ===========================================================================
// client.ts — seam HTTP tới Inngest (subagent #5, Phase 3).
// - Có INGEST_KEY + INGEST_URL → POST event thật tới Inngest Cloud.
// - Không có key → fallback: hộp thư in-app trong bộ nhớ (demo vẫn đầy đủ,
//   không bế tắc; route + notification-due vẫn hoạt động).
// Không cài dependency (inngest chưa có trong dự án) — seam giống lib/library/ai.ts.
// ===========================================================================

import { z } from 'zod'

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'push'] as const
export type Channel = (typeof NOTIFICATION_CHANNELS)[number]

export const NOTIFICATION_KINDS = ['appointment', 'task', 'milestone', 'reminder'] as const
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number]

/** Tên event Inngest tương ứng từng loại reminder (khế ước cho worker thật). */
export const EVENT_NAMES: Record<NotificationKind, string> = {
  appointment: 'mevabe.appointment.reminder',
  task: 'mevabe.task.due',
  milestone: 'mevabe.milestone.week',
  reminder: 'mevabe.reminder.due',
}

export const notificationMessageSchema = z.object({
  id: z.string(),
  kind: z.enum(NOTIFICATION_KINDS),
  title: z.string(),
  detail: z.string(),
  channel: z.enum(NOTIFICATION_CHANNELS),
  due: z.string(),
})
export type NotificationMessage = z.infer<typeof notificationMessageSchema>

/** Hộp thư in-app (fallback khi chưa cấu hình Inngest). */
const inbox: NotificationMessage[] = []

function inngestConfigured(): boolean {
  try {
    return Boolean(process.env.INGEST_KEY && process.env.INGEST_URL)
  } catch {
    return false
  }
}

async function sendEvent(name: string, data: NotificationMessage): Promise<void> {
  const base = process.env.INGEST_URL
  const key = process.env.INGEST_KEY
  if (!base || !key) return
  try {
    const res = await fetch(`${base}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ name, data }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) console.warn('[inngest] send failed', res.status)
  } catch (err) {
    console.warn('[inngest] send error', err)
  }
}

export const notifyClient = {
  isConfigured: inngestConfigured,
  /** Gửi 1 thông báo. Có Inngest → POST event; không → hộp thư in-app (dedupe theo id). */
  async send(msg: NotificationMessage): Promise<void> {
    const m = notificationMessageSchema.parse(msg)
    if (inngestConfigured()) {
      await sendEvent(EVENT_NAMES[m.kind], m)
      return
    }
    if (inbox.some((x) => x.id === m.id)) return // tránh trùng trong cùng phiên
    inbox.push(m)
  },
  /** Hộp thư in-app (fallback), mới nhất trước. */
  inbox(): NotificationMessage[] {
    return [...inbox].reverse()
  },
  clear(): void {
    inbox.length = 0
  },
}

// ---- Self-check fallback: node --experimental-strip-types lib/inngest/client.ts ----
function isMain(): boolean {
  try {
    return process.argv[1]?.endsWith('client.ts') ?? false
  } catch {
    return false
  }
}

if (isMain()) {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error(`FAIL: ${msg}`)
  }
  notifyClient.clear()
  const msg: NotificationMessage = {
    id: 'demo:1',
    kind: 'reminder',
    title: 'Uống vitamin',
    detail: 'Nhắc hằng ngày — hôm nay',
    channel: 'in_app',
    due: '2026-08-04T08:00:00+07:00',
  }
  await notifyClient.send(msg)
  await notifyClient.send(msg) // trùng id → không thêm lần 2
  assert(notifyClient.isConfigured() === false, 'chưa có INGEST_KEY/INGEST_URL → fallback')
  assert(notifyClient.inbox().length === 1, 'fallback in-app + dedupe theo id')
  console.log('✅ inngest client selfcheck OK')
}
