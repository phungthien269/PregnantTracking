// ===========================================================================
// Test: tuần thai + EDD (rules.ts) — khớp web (mock.ts) + iOS (WeekCalculator).
// Dùng assert cục bộ (không import node:assert — packages/domain không có
// @types/node nên giữ cho `tsc --noEmit` của domain sạch).
// ===========================================================================
import { eddFromLmp, lmpFromEdd, weekOfPregnancy, trimester, validateLmpEdd, appointmentsForWeek, isMultiplePregnancy } from './rules'

const DAY_MS = 86_400_000

// ---- assert cục bộ (pattern demo() của domain) ----
const results: { name: string; ok: boolean; err?: string }[] = []
const test = (name: string, fn: () => void): void => {
  try {
    fn()
    results.push({ name, ok: true })
  } catch (e) {
    results.push({ name, ok: false, err: (e as Error).message })
  }
}
const assert = {
  equal: (a: unknown, b: unknown, msg?: string): void => {
    if (a !== b) throw new Error(`${msg ?? 'equal'} — expected ${String(b)}, got ${String(a)}`)
  },
  ok: (cond: unknown, msg?: string): void => {
    if (!cond) throw new Error(msg ?? 'ok')
  },
}

const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY_MS)

// ---- EDD theo Naegele ----
test('eddFromLmp: LMP 16/03/2026 → EDD 21/12/2026 (khớp hằng số mock)', () => {
  assert.equal(eddFromLmp('2026-03-16'), '2026-12-21')
})
test('eddFromLmp: LMP 01/01 + 280 ngày = 08/10', () => {
  assert.equal(eddFromLmp('2026-01-01'), '2026-10-08')
})
test('lmpFromEdd là nghịch đảo của eddFromLmp', () => {
  assert.equal(lmpFromEdd(eddFromLmp('2026-03-15')), '2026-03-15')
})

// ---- Tuần theo EDD: floor((280 − daysLeft)/7) — khớp iOS WeekCalculator + web ----
test('EDD → tuần: kịch bản demo (week 20, daysLeft 140)', () => {
  const lmp = '2026-03-16'
  const edd = '2026-12-21'
  const at = '2026-08-03'
  const daysLeft = daysBetween(at, edd) // = 140 (hằng số DAYS_LEFT của mock)
  const weekEDD = Math.floor((280 - daysLeft) / 7) // khớp iOS WeekCalculator.pregnancyWeek
  const weekLMP = Math.floor(daysBetween(lmp, at) / 7) // khớp iOS fallback LMP
  assert.equal(daysLeft, 140)
  assert.equal(weekEDD, 20) // khớp CURRENT_WEEK = 20 của web mock
  assert.equal(weekLMP, 20) // khớp iOS khi không có EDD
})
test('EDD → tuần: đúng ngày EDD = 40; quá hạn 30 ngày → clamp 42', () => {
  const edd = '2026-12-21'
  const atEdd = Math.min(42, Math.max(0, Math.floor((280 - daysBetween(edd, edd)) / 7)))
  const overdue = Math.min(42, Math.max(0, Math.floor((280 - daysBetween('2027-01-20', edd)) / 7)))
  assert.equal(atEdd, 40)
  assert.equal(overdue, 42)
})

// ---- weekOfPregnancy (completed-weeks theo LMP, khớp web) ----
test('weekOfPregnancy: đúng ngày LMP = tuần 1', () => {
  assert.equal(weekOfPregnancy('2026-01-01', new Date(Date.UTC(2026, 0, 1))), 1)
})
test('weekOfPregnancy: ngày thứ 8 = tuần 1; ngày thứ 60 = tuần 8', () => {
  assert.equal(weekOfPregnancy('2026-01-01', new Date(Date.UTC(2026, 0, 8))), 1)
  assert.equal(weekOfPregnancy('2026-01-01', new Date(Date.UTC(2026, 2, 1))), 8)
})
test('weekOfPregnancy: trước LMP → 0; quá 42 tuần → clamp 42', () => {
  assert.equal(weekOfPregnancy('2026-01-01', new Date(Date.UTC(2025, 11, 31))), 0)
  assert.equal(weekOfPregnancy('2026-01-01', new Date(Date.UTC(2027, 0, 1))), 42)
})

// ---- Tam cá nguyệt ----
test('trimester: biên 13/14 và 27/28', () => {
  assert.equal(trimester(13), 'first')
  assert.equal(trimester(14), 'second')
  assert.equal(trimester(27), 'second')
  assert.equal(trimester(28), 'third')
})

// ---- validateLmpEdd (dung sai ±14 ngày) ----
test('validateLmpEdd: nhất quán → ok', () => {
  assert.equal(validateLmpEdd('2026-01-01', '2026-10-08').ok, true)
  assert.equal(validateLmpEdd('2026-01-01', '2026-10-01').ok, true) // lệch 7 ngày
})
test('validateLmpEdd: mâu thuẫn → không ok + có lý do', () => {
  const r = validateLmpEdd('2026-01-01', '2026-08-01')
  assert.equal(r.ok, false)
  assert.ok((r.reason ?? '').includes('lệch'))
})

// ---- Lịch khám theo mốc ----
test('appointmentsForWeek: tuần 12 có sàng lọc; tuần 13 không có', () => {
  assert.equal(appointmentsForWeek(12).length, 1)
  assert.equal(appointmentsForWeek(12)[0]?.type, 'screening')
  assert.equal(appointmentsForWeek(13).length, 0)
})
test('appointmentsForWeek: có mốc tuần 8 (khám đầu) và tuần 38 (tuần cuối)', () => {
  assert.equal(appointmentsForWeek(8).length, 1)
  assert.equal(appointmentsForWeek(38).length, 1)
})

// ---- Đa thai ----
test('isMultiplePregnancy: 2 thai → true, 1 thai → false', () => {
  assert.equal(isMultiplePregnancy([{}, {}]), true)
  assert.equal(isMultiplePregnancy([{}]), false)
})

// ---- Báo cáo ----
const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.err ? ' — ' + r.err : ''}`)
}
if (failed.length > 0) {
  throw new Error(`rules.test.ts: ${failed.length}/${results.length} test thất bại`)
}
console.log(`✅ rules.test.ts OK — ${results.length} test`)
