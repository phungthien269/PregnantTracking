// ===========================================================================
// Logic "nhắc đến hạn hôm nay" theo Asia/Ho_Chi_Minh (Agent 7, task D.6,
// mở rộng subagent #5 Phase 3: lịch khám, task đến hạn, mốc tuần thai).
// Tách khỏi inngest/engine.ts để self-check chạy được (không import `@/`).
// ===========================================================================

import type { ReminderFrequency } from '@mevabe/domain'
import { weekFromLmp } from './pregnancy-math'

const HCM = 'Asia/Ho_Chi_Minh'

export interface Parts {
  date: string // yyyy-MM-dd theo giờ HCM
  weekday: number // 0=CN … 6=TB
  day: number // ngày trong tháng
}

export function hcmParts(iso: string): Parts {
  const d = new Date(iso)
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: HCM,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const map = new Map(fmt.formatToParts(d).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]))
  const date = `${map.get('year')}-${map.get('month')}-${map.get('day')}`
  const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { date, weekday: WEEKDAYS[map.get('weekday') ?? ''] ?? -1, day: Number(map.get('day')) }
}

export function isDueToday(
  scheduledAt: string,
  freq: ReminderFrequency,
  today: string,
  todayParts: Parts,
): boolean {
  const p = hcmParts(scheduledAt)
  switch (freq) {
    case 'daily':
      return true
    case 'weekly':
      return p.weekday === todayParts.weekday
    case 'monthly':
      return p.day === todayParts.day
    default: // once, custom
      return p.date === today
  }
}

// ---------------------------------------------------------------------------
// Mở rộng (subagent #5): lịch khám hôm nay, task đến hạn, mốc tuần thai.
// Giữ thuần (không import `@/`) để self-check chạy bằng node đơn lẻ.
// ---------------------------------------------------------------------------

/** Lịch khám (ISO có offset) có nằm đúng hôm nay theo giờ HCM? */
export function isAppointmentToday(scheduledAtIso: string, today: string): boolean {
  return hcmParts(scheduledAtIso).date === today
}

/** Task đến hạn đúng hôm nay (due_date dạng yyyy-MM-dd)? */
export function isTaskDueToday(dueDate: string | null, today: string): boolean {
  return dueDate !== null && dueDate === today
}

function prevDateStr(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  const dt = new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, (d ?? 1) - 1))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`
}

/** Tuần thai tại một ngày (1..42) — cùng quy ước completed-weeks với lib/pregnancy-math (uỷ thác). */
export function weekNow(lmp: string, day: string): number {
  return weekFromLmp(lmp, day)
}

/** Hôm nay có bắt đầu tuần thai mới (so với hôm qua)? → nhắc mốc tuần thai. */
export function newWeekStarted(lmp: string, today: string): boolean {
  return weekNow(lmp, today) > weekNow(lmp, prevDateStr(today))
}

// ---- Self-check: được chạy đầy đủ qua notification-due.check.ts (scripts/test-web.sh).
// Chạy trực tiếp file này cần loader (file import ./pregnancy-math không đuôi):
//   node --experimental-strip-types --import scripts/test-web-loader.mjs lib/notification-due.ts
function isMain(): boolean {
  try {
    return process.argv[1]?.endsWith('notification-due.ts') ?? false
  } catch {
    return false
  }
}

if (isMain()) {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error(`FAIL: ${msg}`)
  }
  const tp = hcmParts(new Date('2026-08-04T09:00:00+07:00').toISOString())
  assert(tp.date === '2026-08-04', `hcm date (${tp.date})`)
  assert(hcmParts('2026-08-03T08:00:00+07:00').date === '2026-08-03', 'offset giữ nguyên giờ VN')
  assert(isDueToday('2026-01-01T08:00:00+07:00', 'daily', '2026-08-04', tp), 'daily luôn đến hạn')
  assert(isDueToday('2026-08-03T08:00:00+07:00', 'once', '2026-08-04', tp) === false, 'once đúng ngày')
  assert(isDueToday('2026-08-04T08:00:00+07:00', 'once', '2026-08-04', tp), 'once trúng hôm nay')
  assert(isDueToday('2026-08-01T08:00:00+07:00', 'monthly', '2026-08-04', tp) === false, 'monthly khác ngày')
  assert(isDueToday('2026-07-04T08:00:00+07:00', 'monthly', '2026-08-04', tp), 'monthly cùng ngày 4')
  // ---- Mở rộng: lịch khám / task / mốc tuần thai ----
  assert(isAppointmentToday('2026-08-04T09:00:00+07:00', '2026-08-04'), 'lịch khám hôm nay')
  assert(isAppointmentToday('2026-08-04T23:30:00+07:00', '2026-08-04'), 'lịch khám cuối ngày VN')
  assert(isAppointmentToday('2026-08-05T09:00:00+07:00', '2026-08-04') === false, 'lịch khám khác ngày')
  assert(isTaskDueToday('2026-08-04', '2026-08-04'), 'task đến hạn hôm nay')
  assert(isTaskDueToday('2026-08-03', '2026-08-04') === false, 'task hết hạn hôm qua')
  assert(isTaskDueToday(null, '2026-08-04') === false, 'task không có hạn')
  assert(weekNow('2026-01-01', '2026-01-15') === 2, 'weekNow 14 ngày → tuần 2 (completed weeks)')
  assert(newWeekStarted('2026-01-01', '2026-01-15') === true, 'sang tuần mới (ngày 15)')
  assert(newWeekStarted('2026-01-01', '2026-01-16') === false, 'giữa tuần không nhắc')
  console.log('✅ notification-due selfcheck OK')
}
