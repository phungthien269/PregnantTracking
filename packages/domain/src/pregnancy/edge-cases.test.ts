// ===========================================================================
// Test (bổ sung): biên tuần thai/EDD — bổ sung cho rules.test.ts (agent 9).
// Chỉ đọc import `./rules` (file thường, không kéo directory import) để
// test-domain.sh (shared loader) chạy được; assert cục bộ, không node:assert
// (packages/domain không có @types/node).
// ===========================================================================
import {
  eddFromLmp,
  lmpFromEdd,
  weekOfPregnancy,
  trimester,
  validateLmpEdd,
  appointmentsForWeek,
  DEFAULT_APPOINTMENT_SCHEDULE,
  parseDate,
  formatDate,
  isMultiplePregnancy,
} from './rules'

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

const d = (s: string): Date => new Date(Date.parse(s + 'T00:00:00Z'))

// ---- EDD: năm nhuận + qua mốc năm ----
test('eddFromLmp: LMP 29/02/2024 (năm nhuận) → EDD 05/12/2024', () => {
  assert.equal(eddFromLmp('2024-02-29'), '2024-12-05')
})
test('eddFromLmp: LMP cuối năm 2026-12-31 → EDD 2027-10-07 (qua mốc năm)', () => {
  assert.equal(eddFromLmp('2026-12-31'), '2027-10-07')
})
test('lmpFromEdd là nghịch đảo của eddFromLmp qua năm nhuận', () => {
  assert.equal(lmpFromEdd('2024-12-05'), '2024-02-29')
})

// ---- weekOfPregnancy: biên tuần ----
test('weekOfPregnancy: đúng ngày LMP = 1; ngày thứ 6 vẫn 1; ngày thứ 8 = 1 (completed weeks)', () => {
  assert.equal(weekOfPregnancy('2026-01-01', d('2026-01-01')), 1)
  assert.equal(weekOfPregnancy('2026-01-01', d('2026-01-07')), 1)
  assert.equal(weekOfPregnancy('2026-01-01', d('2026-01-08')), 1)
})
test('weekOfPregnancy: ngày 294 (42 tuần) = 42; ngày 295 clamp vẫn 42', () => {
  assert.equal(weekOfPregnancy('2026-01-01', d('2026-10-22')), 42)
  assert.equal(weekOfPregnancy('2026-01-01', d('2026-10-23')), 42)
})
test('weekOfPregnancy: trước LMP → 0', () => {
  assert.equal(weekOfPregnancy('2026-01-01', d('2025-12-31')), 0)
})

// ---- validateLmpEdd: dung sai đúng ±14 ngày ----
test('validateLmpEdd: EDD lệch đúng 14 ngày → ok; 15 ngày → không ok', () => {
  // eddFromLmp('2026-01-01') = '2026-10-08'; 2026-10-22 lệch 14 ngày; 2026-10-23 lệch 15.
  assert.ok(validateLmpEdd('2026-01-01', '2026-10-22').ok, 'lệch 14 ngày → ok')
  assert.equal(validateLmpEdd('2026-01-01', '2026-10-23').ok, false, 'lệch 15 ngày → không ok')
  assert.ok((validateLmpEdd('2026-01-01', '2026-10-23').reason ?? '').includes('lệch'), 'có reason')
})

// ---- trimester ----
test('trimester: biên 0 và 40', () => {
  assert.equal(trimester(0), 'first')
  assert.equal(trimester(13), 'first')
  assert.equal(trimester(40), 'third')
})

// ---- lịch khám mẫu đầy đủ ----
test('DEFAULT_APPOINTMENT_SCHEDULE: 9 mốc đúng tuần', () => {
  assert.equal(DEFAULT_APPOINTMENT_SCHEDULE.length, 9)
  assert.equal(
    DEFAULT_APPOINTMENT_SCHEDULE.map((a) => a.week).join(','),
    '8,12,16,20,24,28,32,36,38',
  )
})
test('appointmentsForWeek: tuần có mốc → đúng type; tuần không mốc → rỗng', () => {
  assert.equal(appointmentsForWeek(8)[0]?.type, 'first_visit')
  assert.equal(appointmentsForWeek(12)[0]?.type, 'screening')
  assert.equal(appointmentsForWeek(20)[0]?.type, 'ultrasound')
  assert.equal(appointmentsForWeek(38)[0]?.type, 'prenatal')
  assert.equal(appointmentsForWeek(9).length, 0)
  assert.equal(appointmentsForWeek(40).length, 0)
})

// ---- parseDate/formatDate ----
test('parseDate/formatDate: round-trip 2026-03-16', () => {
  assert.equal(formatDate(parseDate('2026-03-16')), '2026-03-16')
})
test('parseDate: năm nhuận 2024-02-29 không trôi ngày', () => {
  assert.equal(formatDate(parseDate('2024-02-29')), '2024-02-29')
})

// ---- đa thai ----
test('isMultiplePregnancy: mảng rỗng → false; 2 phần tử → true', () => {
  assert.equal(isMultiplePregnancy([]), false)
  assert.equal(isMultiplePregnancy([{}]), false)
  assert.equal(isMultiplePregnancy([{}, {}]), true)
})

// ---- Báo cáo ----
const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.err ? ' — ' + r.err : ''}`)
}
if (failed.length > 0) {
  throw new Error(`edge-cases.test.ts: ${failed.length}/${results.length} test thất bại`)
}
console.log(`✅ pregnancy/edge-cases.test.ts OK — ${results.length} test`)
