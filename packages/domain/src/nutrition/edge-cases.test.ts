// ===========================================================================
// Test (bổ sung): an toàn thực phẩm — biên từ khóa/tuần (bổ sung
// food-safety.test.ts của agent 9). Chỉ đọc import `./food-safety` (type-only
// import `./index` nên không kéo directory import) để test-domain.sh chạy được.
// ===========================================================================
import { foodSafetyLevel, riskyFoodsForWeek } from './food-safety'

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

// ---- khớp từ khóa con + hoa/thường + trim ----
test('foodSafetyLevel: khớp từ khóa con (không phân biệt hoa thường, bỏ khoảng trắng)', () => {
  assert.equal(foodSafetyLevel('Tiết canh')?.level, 'avoid')
  assert.equal(foodSafetyLevel('trứng lòng đào')?.level, 'avoid')
  assert.equal(foodSafetyLevel('trứng sống')?.level, 'avoid')
  assert.equal(foodSafetyLevel('  Rượu, bia  ')?.level, 'avoid')
})
test('foodSafetyLevel: gộp nhiều thực phẩm trong 1 rule — "Pate (kể cả pate gan)"', () => {
  assert.equal(foodSafetyLevel('Pate (kể cả pate gan)')?.level, 'limit')
  assert.equal(foodSafetyLevel('pate gan')?.level, 'limit')
})
test('foodSafetyLevel: không khớp token → undefined ("Trứng ốp la" không phải lòng đào)', () => {
  assert.equal(foodSafetyLevel('Trứng ốp la'), undefined)
})
test('foodSafetyLevel: chuỗi rỗng/khoảng trắng → undefined', () => {
  assert.equal(foodSafetyLevel('   '), undefined)
  assert.equal(foodSafetyLevel(''), undefined)
})

// ---- giới hạn theo tuần (caffeine 1–42) ----
test('foodSafetyLevel: cà phê trong tuần 5 → limit; tuần 43 → undefined (hết hạn)', () => {
  assert.equal(foodSafetyLevel('Cà phê', 5)?.level, 'limit')
  assert.equal(foodSafetyLevel('Cà phê', 43), undefined)
  assert.equal(foodSafetyLevel('Cà phê')?.level, 'limit', 'không truyền tuần → áp dụng')
})
test('foodSafetyLevel: tuần = 0 (falsy) bị coi như không truyền tuần → vẫn limit', () => {
  // Quirk hiện tại: `!week` khi week=0 → bỏ qua cửa sổ tuần. Ghi nhận hành vi, không sửa.
  assert.equal(foodSafetyLevel('Cà phê', 0)?.level, 'limit')
})

// ---- riskyFoodsForWeek: lọc theo tuần + mức ----
test('riskyFoodsForWeek: tuần 0 loại caffeine (ngoài cửa sổ 1–42)', () => {
  assert.equal(riskyFoodsForWeek(0, 'limit').some((r) => r.category === 'caffeine'), false)
})
test('riskyFoodsForWeek: tuần 5 có caffeine; tuần 43 thì hết hạn', () => {
  assert.equal(riskyFoodsForWeek(5, 'limit').some((r) => r.category === 'caffeine'), true)
  assert.equal(riskyFoodsForWeek(43).length, 17, 'tuần 43 còn 17 rule (trừ caffeine)')
})
test('riskyFoodsForWeek: tuần 20 → đủ 18 rule; lọc avoid → 9', () => {
  assert.equal(riskyFoodsForWeek(20).length, 18)
  assert.equal(riskyFoodsForWeek(20, 'avoid').length, 9)
  assert.equal(riskyFoodsForWeek(20, 'avoid').every((r) => r.level === 'avoid'), true)
})

// ---- Báo cáo ----
const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.err ? ' — ' + r.err : ''}`)
}
if (failed.length > 0) {
  throw new Error(`edge-cases.test.ts: ${failed.length}/${results.length} test thất bại`)
}
console.log(`✅ nutrition/edge-cases.test.ts OK — ${results.length} test`)
