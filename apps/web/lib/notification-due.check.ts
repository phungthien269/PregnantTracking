// ===========================================================================
// notification-due.check.ts — test logic nhắc đến hạn (apps/web/lib/notification-due.ts):
//   hcmParts (biên ngày/múi giờ Asia/Ho_Chi_Minh), isDueToday, isAppointmentToday,
//   isTaskDueToday, weekNow, newWeekStarted.
// Chạy: scripts/test-web.sh.
// ===========================================================================

import { hcmParts, isDueToday, isAppointmentToday, isTaskDueToday, weekNow, newWeekStarted } from './notification-due'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
}

let n = 0
const test = (name: string, fn: () => void): void => {
  n++
  try {
    fn()
    console.log(`  ✔ ${n}. ${name}`)
  } catch (e) {
    console.error(`  ✘ ${n}. ${name} — ${(e as Error).message}`)
    throw e
  }
}

const iso = (s: string): string => new Date(s).toISOString()

// ---- hcmParts: ngày/giờ theo Asia/Ho_Chi_Minh ----
test('hcmParts: 17:30Z ngày 03/08 = 00:30 sáng 04/08 giờ VN', () => {
  const p = hcmParts(iso('2026-08-03T17:30:00Z'))
  assert(p.date === '2026-08-04', `date = ${p.date}`)
  assert(p.day === 4, 'day = 4')
  assert(p.weekday === 2, '04/08/2026 là thứ Ba (2)')
})

test('hcmParts: 17:30Z ngày 04/08 = 00:30 sáng 05/08 giờ VN', () => {
  const p = hcmParts(iso('2026-08-04T17:30:00Z'))
  assert(p.date === '2026-08-05', `date = ${p.date}`)
  assert(p.weekday === 3, '05/08/2026 là thứ Tư (3)')
})

test('hcmParts: Chủ Nhật → weekday 0', () => {
  const p = hcmParts(iso('2026-08-09T12:00:00Z'))
  assert(p.date === '2026-08-09' && p.weekday === 0, '09/08/2026 là Chủ Nhật')
})

// ---- isDueToday: daily/weekly/monthly/once ----
test('isDueToday: daily luôn đúng', () => {
  const tp = hcmParts(iso('2026-08-04T09:00:00+07:00'))
  assert(isDueToday('2026-01-01T08:00:00+07:00', 'daily', '2026-08-04', tp), 'daily → true')
})

test('isDueToday: weekly so theo thứ trong tuần (cùng weekday, khác ngày)', () => {
  const monday1 = hcmParts(iso('2026-08-03T09:00:00+07:00')) // thứ 2 tuần này
  const monday2 = hcmParts(iso('2026-08-10T09:00:00+07:00')) // thứ 2 tuần sau
  assert(isDueToday('2026-08-03T08:00:00+07:00', 'weekly', '2026-08-10', monday2), 'cùng thứ 2 → true')
  const tuesday = hcmParts(iso('2026-08-11T09:00:00+07:00'))
  assert(isDueToday('2026-08-03T08:00:00+07:00', 'weekly', '2026-08-11', tuesday) === false, 'thứ 3 ≠ thứ 2 → false')
  assert(monday1.weekday === monday2.weekday, 'monday1.weekday === monday2.weekday')
})

test('isDueToday: monthly so theo ngày trong tháng (kể cả ngày 31)', () => {
  const today4 = hcmParts(iso('2026-08-04T09:00:00+07:00'))
  const today5 = hcmParts(iso('2026-08-05T09:00:00+07:00'))
  assert(isDueToday('2026-07-04T08:00:00+07:00', 'monthly', '2026-08-04', today4), 'cùng ngày 4 → true')
  assert(isDueToday('2026-07-04T08:00:00+07:00', 'monthly', '2026-08-05', today5) === false, 'ngày 5 ≠ 4 → false')
  const aug31 = hcmParts(iso('2026-08-31T09:00:00+07:00'))
  const sep30 = hcmParts(iso('2026-09-30T09:00:00+07:00'))
  assert(isDueToday('2026-07-31T08:00:00+07:00', 'monthly', '2026-08-31', aug31), 'ngày 31 → true')
  assert(isDueToday('2026-07-31T08:00:00+07:00', 'monthly', '2026-09-30', sep30) === false, 'tháng 30 ngày không trùng 31')
})

test('isDueToday: once so đúng ngày yyyy-MM-dd', () => {
  const tp = hcmParts(iso('2026-08-04T09:00:00+07:00'))
  assert(isDueToday('2026-08-04T08:00:00+07:00', 'once', '2026-08-04', tp), 'trúng hôm nay → true')
  assert(isDueToday('2026-08-05T08:00:00+07:00', 'once', '2026-08-04', tp) === false, 'khác ngày → false')
})

// ---- isAppointmentToday: biên ngày theo giờ HCM ----
test('isAppointmentToday: 17:30Z ngày 04/08 = 05/08 giờ VN', () => {
  assert(isAppointmentToday('2026-08-04T17:30:00Z', '2026-08-04') === false, 'lịch 04/08 17:30Z không phải hôm nay 04/08 (VN là 05/08)')
  assert(isAppointmentToday('2026-08-04T17:30:00Z', '2026-08-05'), 'nhưng đúng 05/08 giờ VN')
  assert(isAppointmentToday('2026-08-04T09:00:00+07:00', '2026-08-04'), 'lịch có offset +07 giữ nguyên ngày')
})

// ---- isTaskDueToday ----
test('isTaskDueToday: đúng ngày / null', () => {
  assert(isTaskDueToday('2026-08-04', '2026-08-04'), 'trùng → true')
  assert(isTaskDueToday('2026-08-03', '2026-08-04') === false, 'hết hạn hôm qua → false')
  assert(isTaskDueToday(null, '2026-08-04') === false, 'không có hạn → false')
})

// ---- weekNow: tuần thai (1..42) — quy ước completed-weeks: ngày LMP = 1, 14 ngày = 2 ----
test('weekNow: đúng ngày LMP = tuần 1; 7 ngày = 1; 14 ngày = 2', () => {
  assert(weekNow('2026-01-01', '2026-01-01') === 1, 'LMP → 1')
  assert(weekNow('2026-01-01', '2026-01-07') === 1, '6 ngày → 1')
  assert(weekNow('2026-01-01', '2026-01-08') === 1, '7 ngày → 1 (chưa tròn 2 tuần)')
  assert(weekNow('2026-01-01', '2026-01-15') === 2, '14 ngày → 2')
})

test('weekNow: clamp 42 (ngày 294 = tuần 42, ngày 295 vẫn 42)', () => {
  assert(weekNow('2026-01-01', '2026-10-22') === 42, '294 ngày → 42')
  assert(weekNow('2026-01-01', '2026-10-23') === 42, '295 ngày → 42 (clamp)')
})

test('weekNow: trước LMP vẫn clamp min 1', () => {
  assert(weekNow('2026-01-01', '2025-12-31') === 1, 'trước LMP → 1 (không có tuần 0)')
})

// ---- newWeekStarted: sang tuần mới ----
test('newWeekStarted: đúng mốc tuần (ngày 15) → true; giữa tuần → false', () => {
  assert(newWeekStarted('2026-01-01', '2026-01-15') === true, 'ngày 15 bắt đầu tuần 2')
  assert(newWeekStarted('2026-01-01', '2026-01-14') === false, 'ngày 14 còn tuần 1')
  assert(newWeekStarted('2026-01-01', '2026-01-16') === false, 'ngày 16 giữa tuần 2')
})

test('newWeekStarted: LMP hôm qua → hôm nay đã tuần 2', () => {
  // LMP = 01/01, xét hôm nay 02/01 (ngày 2) — không sang tuần
  assert(newWeekStarted('2026-01-01', '2026-01-02') === false, 'ngày 2 không sang tuần')
})

console.log(`\n✅ notification-due.check OK — ${n} test`)
