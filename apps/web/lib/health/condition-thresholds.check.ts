// ===========================================================================
// condition-thresholds.check.ts — test mốc tham khảo thai kỳ (Phase 4A).
// Chạy: scripts/test-web.sh.
// ===========================================================================

import { checkMeasurement, PREGNANCY_THRESHOLDS } from './condition-thresholds'

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

test('3 loại chỉ số có mốc tham khảo', () => {
  assert(PREGNANCY_THRESHOLDS.length === 3, `số rule = ${PREGNANCY_THRESHOLDS.length}`)
})

test('huyết áp: <140/90 không ngoài mốc; ≥140 tâm thu / ≥90 tâm trương ngoài mốc', () => {
  assert(checkMeasurement('blood_pressure', 120, 78) === null, '120/78 → null')
  assert(checkMeasurement('blood_pressure', 139, 89) === null, '139/89 → null')
  const sys = checkMeasurement('blood_pressure', 140, 88)
  assert(sys?.context.includes('140/90'), `tâm thu 140 → ngoài mốc (${sys?.context})`)
  const dia = checkMeasurement('blood_pressure', 135, 90)
  assert(dia?.context.includes('140/90'), `tâm trương 90 → ngoài mốc (${dia?.context})`)
})

test('đường huyết: <5.1 không ngoài mốc; ≥5.1 ngoài mốc', () => {
  assert(checkMeasurement('blood_glucose', 5.0) === null, '5.0 → null')
  assert(checkMeasurement('blood_glucose', 5.1)?.context.includes('5.1'), '5.1 → ngoài mốc')
})

test('nhịp tim: <100 không ngoài mốc; ≥100 ngoài mốc', () => {
  assert(checkMeasurement('heart_rate', 99) === null, '99 → null')
  assert(checkMeasurement('heart_rate', 100)?.context.includes('100'), '100 → ngoài mốc')
})

test('chỉ số không có mốc (cân nặng) → null', () => {
  assert(checkMeasurement('weight', 999) === null, 'weight không có mốc → null')
  assert(checkMeasurement('fundal_height', 40) === null, 'fundal_height → null')
})

console.log(`\n✅ condition-thresholds.check OK — ${n} test`)
