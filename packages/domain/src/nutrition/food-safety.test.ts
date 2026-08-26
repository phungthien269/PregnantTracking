// ===========================================================================
// Test: an toàn thực phẩm thai kỳ (food-safety.ts) — mức avoid/limit theo từ
// khóa + giới hạn tuần. Dùng assert cục bộ (không import node:assert).
// ===========================================================================
import { foodSafetyLevel, riskyFoodsForWeek } from './food-safety'

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

// ---- Mức theo từ khóa ----
test('tiết canh → avoid', () => {
  assert.equal(foodSafetyLevel('tiết canh vịt')?.level, 'avoid')
})
test('thịt sống/tái, gỏi → avoid', () => {
  assert.equal(foodSafetyLevel('gỏi cá sống')?.level, 'avoid')
})
test('trứng lòng đào → avoid', () => {
  assert.equal(foodSafetyLevel('trứng lòng đào')?.level, 'avoid')
})
test('rượu, bia → avoid', () => {
  assert.equal(foodSafetyLevel('bia')?.level, 'avoid')
  assert.equal(foodSafetyLevel('uống rượu')?.level, 'avoid')
})
test('pate gan → limit', () => {
  assert.equal(foodSafetyLevel('pate gan')?.level, 'limit')
})

// ---- Giới hạn theo tuần (caffeine 1–42) ----
test('cà phê → limit khi trong khung tuần hoặc không truyền tuần', () => {
  assert.equal(foodSafetyLevel('Một ly cà phê sữa đá', 12)?.level, 'limit')
  assert.equal(foodSafetyLevel('Một ly cà phê sữa đá')?.level, 'limit')
})
test('cà phê ngoài khung tuần (>42) → undefined', () => {
  assert.equal(foodSafetyLevel('cà phê', 50), undefined)
})
test('món không giới hạn tuần vẫn trả kết quả ở mọi tuần', () => {
  assert.equal(foodSafetyLevel('tiết canh', 20)?.level, 'avoid')
  assert.equal(foodSafetyLevel('tiết canh', 41)?.level, 'avoid')
})

// ---- Không khớp / chuỗi rỗng ----
test('thực phẩm an toàn không trong danh sách → undefined', () => {
  assert.equal(foodSafetyLevel('rau muống'), undefined)
  assert.equal(foodSafetyLevel(''), undefined)
})
test('khớp không phân biệt hoa thường', () => {
  assert.equal(foodSafetyLevel('TIẾT CANH VỊT')?.level, 'avoid')
})

// ---- riskyFoodsForWeek ----
test('riskyFoodsForWeek(20, avoid): chỉ trả món avoid', () => {
  const avoids = riskyFoodsForWeek(20, 'avoid')
  assert.ok(avoids.length >= 5)
  assert.ok(avoids.every((r) => r.level === 'avoid'))
})
test('riskyFoodsForWeek(10): có tiết canh (món không theo tuần)', () => {
  assert.ok(riskyFoodsForWeek(10).some((r) => r.food === 'Tiết canh'))
})

const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`  ${r.ok ? '✅' : '❌'} ${r.name}${r.err ? ' — ' + r.err : ''}`)
}
if (failed.length > 0) {
  throw new Error(`food-safety.test.ts: ${failed.length}/${results.length} test thất bại`)
}
console.log(`✅ food-safety.test.ts OK — ${results.length} test`)
