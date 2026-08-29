// ===========================================================================
// symptom-meals.check.ts — tự kiểm tra lib/symptom-meals.ts.
// Chạy: cd code && node --experimental-strip-types --import ./scripts/test-web-loader.mjs apps/web/lib/symptom-meals.check.ts
// Kiểm tra: nhận diện nhóm, món gợi ý hợp lệ (có trong MEALS), lọc tam cá nguyệt,
// tránh món không phù hợp theo nhóm.
// ===========================================================================

import {
  CATEGORIES,
  buildMealPlan,
  detectEatingSymptom,
  normalizeVn,
  suggestMeals,
  trimesterOfWeek,
} from './symptom-meals'
import { getMeal } from './nutrition/meals-data'

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

// ---- 1. NHẬN DIỆN NHÓM ----
test('nhận diện nhóm ăn uống (có dấu + không dấu)', () => {
  assert(detectEatingSymptom('Buồn nôn mỗi sáng') === 'nausea', 'buồn nôn → nausea')
  assert(detectEatingSymptom('buon non sau khi an') === 'nausea', 'buồn nôn không dấu → nausea')
  assert(detectEatingSymptom('nôn khan') === 'nausea', 'nôn → nausea')
  assert(detectEatingSymptom('ợ nóng sau khi ăn') === 'heartburn', 'ợ nóng → heartburn')
  assert(detectEatingSymptom('sốt nóng') === null, 'sốt nóng → null (không nhầm với nôn)')
  assert(detectEatingSymptom('trào ngược') === 'heartburn', 'trào ngược → heartburn')
  assert(detectEatingSymptom('Chán ăn, ăn không ngon') === 'loss_appetite', 'chán ăn → loss_appetite')
  assert(detectEatingSymptom('đổi khẩu vị') === 'taste_change', 'đổi khẩu vị → taste_change')
  assert(detectEatingSymptom('đau lưng') === null, 'đau lưng → null')
  assert(detectEatingSymptom('sốt nhẹ') === null, 'sốt → null')
})

// ---- 2. MÓN GỢI Ý HỢP LỆ ----
test('mọi món gợi ý đều là phần tử của MEALS', () => {
  for (const c of CATEGORIES) {
    for (const { meal } of suggestMeals(c.id, { week: 8, limit: 20 })) {
      assert(getMeal(meal.id) === meal, `${c.id}: "${meal.id}" không trỏ đúng món trong MEALS`)
    }
  }
})

test('gợi ý không trống với mỗi nhóm ở tuần giữa thai kỳ', () => {
  for (const c of CATEGORIES) {
    const top = suggestMeals(c.id, { week: 20, limit: 3 })
    assert(top.length >= 1, `${c.id} phải có ≥1 món ở tuần 20`)
  }
})

// ---- 3. BUỒN NÔN (T1) ----
test('buồn nôn tuần 8: ưu tiên món dễ tiêu/có gừng, loại món không hợp T1', () => {
  const top = suggestMeals('nausea', { week: 8, limit: 3 }).map((s) => s.meal)
  assert(top.length >= 1, 'buồn nôn T1 phải có món gợi ý')
  assert(top.every((m) => m.trimester.includes('1')), 'mọi món phải hợp T1')
  assert(top.some((m) => m.id === 'chao-ca'), 'cháo cá (gừng, dễ tiêu) phải được gợi ý cho ốm nghén T1')
  assert(!top.some((m) => m.id === 'bun-bo-hue'), 'bún bò Huế không hợp ốm nghén T1')
})

test('buồn nôn T1: không gợi ý món cá béo', () => {
  for (const { meal } of suggestMeals('nausea', { week: 8, limit: 10 })) {
    assert(!meal.tags.includes('món cá béo'), `buồn nôn không nên gợi ý món cá béo (${meal.id})`)
  }
})

// ---- 4. Ợ NÓNG (T3) ----
test('ợ nóng tuần 30: tránh món chiên/nướng/cá béo và nguyên liệu cay chua', () => {
  const top = suggestMeals('heartburn', { week: 30, limit: 5 }).map((s) => s.meal)
  assert(top.length >= 1, 'ợ nóng T3 phải có món gợi ý')
  assert(top.every((m) => m.trimester.includes('3')), 'mọi món phải hợp T3')
  for (const m of top) {
    assert(!m.tags.includes('món chiên') && !m.tags.includes('món nướng') && !m.tags.includes('món cá béo'),
      `ợ nóng không nên gợi ý món nặng (${m.id})`)
  }
  // bún bò Huế (cay, có ớt) không nằm trong top cho ợ nóng.
  assert(!top.some((m) => m.id === 'bun-bo-hue'), 'bún bò Huế (cay) không hợp ợ nóng')
})

// ---- 5. CHÁN ĂN (T2) ----
test('chán ăn tuần 15: món nhẹ theo bữa phụ/sáng, hợp T2', () => {
  const top = suggestMeals('loss_appetite', { week: 15, limit: 5 }).map((s) => s.meal)
  assert(top.length >= 1, 'chán ăn T2 phải có món gợi ý')
  assert(top.every((m) => m.trimester.includes('2')), 'mọi món phải hợp T2')
})

// ---- 6. TAM CÁ NGUYỆT ----
test('trimesterOfWeek đúng mốc T1/T2/T3', () => {
  assert(trimesterOfWeek(8) === '1', 'tuần 8 → T1')
  assert(trimesterOfWeek(13) === '1', 'tuần 13 → T1')
  assert(trimesterOfWeek(14) === '2', 'tuần 14 → T2')
  assert(trimesterOfWeek(26) === '2', 'tuần 26 → T2')
  assert(trimesterOfWeek(27) === '3', 'tuần 27 → T3')
  assert(trimesterOfWeek(42) === '3', 'tuần 42 → T3')
  assert(trimesterOfWeek(null) === null, 'không có tuần → null')
})

// ---- 7. NORMALIZE ----
test('normalizeVn bỏ dấu tiếng Việt + đ→d', () => {
  assert(normalizeVn('Buồn nôn, ợ nóng') === 'buon non, o nong', 'bỏ dấu sai')
  assert(normalizeVn('Đổi khẩu vị') === 'doi khau vi', 'đ→d sai')
})

// ---- 8. BUILD MEAL PLAN ----
test('buildMealPlan gộp theo nhóm, bỏ triệu chứng không liên quan', () => {
  const plans = buildMealPlan(
    [
      { symptom: 'buồn nôn sáng' },
      { symptom: 'ợ nóng' },
      { symptom: 'đau lưng' },
      { symptom: 'chán ăn, ăn không ngon' },
    ],
    { week: 8 },
  )
  assert(plans.length === 3, `kỳ vọng 3 nhóm, được ${plans.length}`)
  const ids = plans.map((p) => p.category).sort()
  assert(ids.join(',') === 'heartburn,loss_appetite,nausea', `nhóm sai: ${ids.join(',')}`)
  for (const p of plans) {
    assert(p.suggestions.length >= 1, `${p.category} phải có gợi ý`)
  }
})

test('buildMealPlan trả rỗng khi không có triệu chứng ăn uống', () => {
  assert(buildMealPlan([{ symptom: 'đau lưng' }, { symptom: 'sốt nhẹ' }], { week: 8 }).length === 0, 'phải rỗng')
})

console.log(`\n✅ symptom-meals check OK — ${n} test`)
