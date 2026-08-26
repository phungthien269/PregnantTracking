// ===========================================================================
// trimester.check.ts — đảm bảo RANH GIỚI TAM CÁ NGUYỆT thống nhất mọi nguồn.
// Chuẩn ACOG/WHO: T1 = tuần 1–13 · T2 = 14–27 · T3 = 28–40 (tuần 27 = T2).
// So `trimesterForWeek` (intake-calcs) với nhóm weekly-focus (weekly-focus-data)
// tại các tuần mốc biên: 13, 14, 26, 27, 28, 40 — KHÔNG được mâu thuẫn.
// Chạy tự động qua scripts/test-web.sh (tự phát hiện *.check.ts) hoặc trực tiếp:
//   node --experimental-strip-types --import scripts/test-web-loader.mjs \
//     apps/web/lib/nutrition/trimester.check.ts
// ===========================================================================
import { getWeeklyFocus } from './weekly-focus-data'
import { trimesterForWeek } from './intake-calcs'
import { trimesterOf } from '../week'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
}

/** Nhóm weekly-focus của tuần — null (ngoài 1–40) là lỗi. */
const focusGroupFor = (week: number) => {
  const g = getWeeklyFocus(week)
  assert(g !== null, `tuần ${week}: weekly-focus không có nhóm`)
  return g!
}

const T: Record<string, 'T1' | 'T2' | 'T3'> = { first: 'T1', second: 'T2', third: 'T3' }

// Các tuần mốc biên: cả hai nguồn phải trả cùng tam cá nguyệt, đúng chuẩn.
const BOUNDARY_WEEKS: Array<[number, 'T1' | 'T2' | 'T3']> = [
  [13, 'T1'], // tuần cuối T1
  [14, 'T2'], // tuần đầu T2
  [26, 'T2'],
  [27, 'T2'], // tuần cuối T2 — trước đây lệch thành T3
  [28, 'T3'], // tuần đầu T3
  [40, 'T3'],
]

for (const [w, expected] of BOUNDARY_WEEKS) {
  const calc = trimesterForWeek(w)
  const group = focusGroupFor(w)
  assert(calc === expected, `tuần ${w}: trimesterForWeek = ${calc}, cần ${expected}`)
  assert(group.trimester === expected, `tuần ${w}: weekly-focus nhóm = ${group.trimester}, cần ${expected}`)
  assert(calc === group.trimester, `tuần ${w}: trimesterForWeek (${calc}) ≠ weekly-focus (${group.trimester})`)
}

// Bao phủ toàn bộ 1–40 — mọi tuần đều khớp, không sót biên.
for (let w = 1; w <= 40; w++) {
  const group = focusGroupFor(w)
  assert(trimesterForWeek(w) === group.trimester, `tuần ${w}: lệch (trimesterForWeek=${trimesterForWeek(w)}, weekly-focus=${group.trimester})`)
}

// lib/week.ts (dùng cho UI) cũng phải khớp chuẩn: T2 kết thúc ở tuần 27.
assert(T[trimesterOf(27)] === 'T2', 'week.trimesterOf(27) phải là T2')
assert(T[trimesterOf(28)] === 'T3', 'week.trimesterOf(28) phải là T3')
assert(T[trimesterOf(13)] === 'T1' && T[trimesterOf(14)] === 'T2', 'week.trimesterOf biên 13/14 lệch')

console.log('✅ trimester.check OK — T1=1–13 · T2=14–27 · T3=28–40: trimesterForWeek = weekly-focus = week.trimesterOf')
