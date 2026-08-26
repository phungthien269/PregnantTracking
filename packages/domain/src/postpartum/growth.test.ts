// ===========================================================================
// Test: tăng trưởng 0–24 tháng (growth.ts) — percentile WHO + nội suy + mốc
// phát triển theo giai đoạn. Dùng assert cục bộ (không import node:assert).
// ===========================================================================
import { percentileValue, growthPercentile, milestonesForStage } from './growth'

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

// ---- Giá trị percentile tại mốc ----
test('P50 bé trai 0m cân nặng = 3.3 kg', () => {
  assert.equal(percentileValue('male', 'weight', 0, 50), 3.3)
})
test('P50 bé gái 12m chiều cao = 74.0 cm', () => {
  assert.equal(percentileValue('female', 'height', 12, 50), 74.0)
})
test('P97 bé trai 24m cân nặng = 15.3 kg', () => {
  assert.equal(percentileValue('male', 'weight', 24, 97), 15.3)
})

// ---- Vòng đầu (head) 0–24 tháng — WHO Head Circumference-for-age ----
test('P50 vòng đầu bé trai 12m = 46.1 cm; P50 bé gái 0m = 33.9 cm', () => {
  assert.equal(percentileValue('male', 'head', 12, 50), 46.1)
  assert.equal(percentileValue('female', 'head', 0, 50), 33.9)
})
test('P3 vòng đầu bé trai 24m = 45.7 cm; P97 bé gái 6m = 44.7 cm', () => {
  assert.equal(percentileValue('male', 'head', 24, 3), 45.7)
  assert.equal(percentileValue('female', 'head', 6, 97), 44.7)
})
test('growthPercentile head: 43.3cm nam 6m → p50; 46.5cm nữ 12m → p85', () => {
  assert.equal(growthPercentile('male', 'head', 6, 43.3), 'p50')
  assert.equal(growthPercentile('female', 'head', 12, 46.5), 'p85')
})
test('growthPercentile head: dưới P3 → <p3', () => {
  assert.equal(growthPercentile('male', 'head', 0, 31.0), '<p3')
})

// ---- Nội suy tuyến tính giữa 2 mốc ----
test('bé trai 1.5m P50 cân nặng nội suy giữa 1m (4.5) và 3m (6.4) → 5.0', () => {
  assert.equal(percentileValue('male', 'weight', 1.5, 50), 5.0)
})

// ---- Clamp tháng ngoài phạm vi 0–24 ----
test('tháng 30 bị clamp về 24 → P50 = 12.2; tháng âm clamp về 0', () => {
  assert.equal(percentileValue('male', 'weight', 30, 50), 12.2)
  assert.equal(percentileValue('male', 'weight', -3, 50), 3.3)
})

// ---- Xếp percentile ----
test('growthPercentile: 3.1kg → p15; 3.5kg → p50', () => {
  assert.equal(growthPercentile('male', 'weight', 0, 3.1), 'p15')
  assert.equal(growthPercentile('male', 'weight', 0, 3.5), 'p50')
})
test('growthPercentile: dưới p3 → <p3; trên p97 → >p97', () => {
  assert.equal(growthPercentile('male', 'weight', 0, 2.0), '<p3')
  assert.equal(growthPercentile('male', 'weight', 0, 5.0), '>p97')
})
test('growthPercentile: đúng mốc p85 (3.8) → p85', () => {
  assert.equal(growthPercentile('male', 'weight', 0, 3.8), 'p85')
})

// ---- Mốc phát triển theo giai đoạn ----
test('mốc newborn có 2 mục; age_12_24m có 4 mục', () => {
  assert.equal(milestonesForStage('newborn').length, 2)
  assert.equal(milestonesForStage('age_12_24m').length, 4)
})
test('định dạng mốc có tên + tháng điển hình', () => {
  const ms = milestonesForStage('age_12_24m')
  assert.ok(ms.some((m) => m.includes('Đi vững') && m.includes('tháng 14')))
})

const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.err ? ' — ' + r.err : ''}`)
}
if (failed.length > 0) {
  throw new Error(`growth.test.ts: ${failed.length}/${results.length} test thất bại`)
}
console.log(`✅ growth.test.ts OK — ${results.length} test`)
