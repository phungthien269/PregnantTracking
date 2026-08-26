// ===========================================================================
// foods-meals.check.ts — tự kiểm tra foods-data.ts + meals-data.ts (Agent N-A).
// Chạy: cd code && node --experimental-strip-types apps/web/lib/nutrition/foods-meals.check.ts
// (import dùng đuôi .ts để chạy được bằng node đơn lẻ, không cần loader).
// Kiểm tra: số lượng, tính hợp lệ số liệu, tham chiếu nguyên liệu, tổng dinh dưỡng.
// ===========================================================================

import { FOODS, FOOD_GROUPS, FOOD_ACCURACIES, getFood, type FoodNutrition } from './foods-data'
import { MEALS, MEAL_TYPES, TRIMESTERS, computeMealNutrition } from './meals-data'

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

const close = (a: number, b: number, tol = 0.3): boolean => Math.abs(a - b) <= tol

// ---- 1. THỰC PHẨM ----
test(`có ≥120 thực phẩm (được ${FOODS.length})`, () => {
  assert(FOODS.length >= 120, `FOODS.length = ${FOODS.length}`)
})

test('id và tên thực phẩm duy nhất', () => {
  const ids = FOODS.map((f) => f.id)
  const names = FOODS.map((f) => f.name)
  assert(new Set(ids).size === ids.length, 'trùng id')
  assert(new Set(names).size === names.length, 'trùng tên')
})

test('mọi thực phẩm hợp lệ: số hữu hạn, không âm, có năng lượng', () => {
  for (const f of FOODS) {
    assert(f.id && f.name, `thực phẩm thiếu id/tên (${f.id})`)
    assert(FOOD_GROUPS.includes(f.group), `group không hợp lệ (${f.id}: ${f.group})`)
    assert(FOOD_ACCURACIES.includes(f.accuracy), `accuracy không hợp lệ (${f.id})`)
    for (const k of Object.keys(f.per100g) as (keyof FoodNutrition)[]) {
      const v = f.per100g[k]
      assert(Number.isFinite(v), `${f.id}.${k} không phải số hữu hạn`)
      assert(v >= 0, `${f.id}.${k} âm (${v})`)
    }
    // Mọi thực phẩm phải có năng lượng > 0, ngoại trừ gia vị phi dinh dưỡng (muối i-ốt).
    if (f.per100g.kcal === 0) {
      assert(
        f.group === 'gia-vi' && (f.per100g.sodium > 0 || f.per100g.iodine > 0),
        `${f.id} kcal=0 nhưng không phải gia vị phi dinh dưỡng`,
      )
    }
    const macros = f.per100g.protein + f.per100g.carb + f.per100g.fat
    assert(macros > 0 || f.group === 'gia-vi', `${f.id} không có chất sinh năng lượng`)
    assert(f.safety && typeof f.safety === 'object', `${f.id} thiếu safety`)
    if (f.safety.avoid || f.safety.limit) {
      assert(!!f.safety.reason, `${f.id} cờ an toàn nhưng thiếu reason`)
    }
  }
})

test('cờ an toàn quan trọng: gan/cá kiếm/cá mập → avoid; cá ngừ/rong biển → limit', () => {
  assert(getFood('gan-ga')?.safety.avoid === true, 'gan-ga phải avoid')
  assert(getFood('gan-lon')?.safety.avoid === true, 'gan-lon phải avoid')
  assert(getFood('ca-kiem')?.safety.avoid === true, 'ca-kiem phải avoid')
  assert(getFood('ca-map')?.safety.avoid === true, 'ca-map phải avoid')
  assert(getFood('ca-ngu')?.safety.limit === true, 'ca-ngu phải limit')
  assert(getFood('rong-bien')?.safety.limit === true, 'rong-bien phải limit')
  assert(getFood('gia-do')?.safety.cook === true, 'gia-do phải cook')
  assert(getFood('huyet-lon')?.safety.cook === true, 'huyet-lon phải cook')
})

test('số liệu mốc chuẩn khớp KB GĐ2 / Bảng TP VN 2007 (rau ngót, ổi, cá hồi, đậu phụ)', () => {
  const rauNgot = getFood('rau-ngot')!.per100g
  assert(close(rauNgot.iron, 2.7), `rau-ngot sắt ${rauNgot.iron}`)
  assert(close(rauNgot.vitaminC, 185), `rau-ngot vitC ${rauNgot.vitaminC}`)
  assert(close(rauNgot.calcium, 169), `rau-ngot canxi ${rauNgot.calcium}`)
  assert(close(getFood('oi')!.per100g.vitaminC, 228), 'ổi vitC')
  assert(close(getFood('ca-hoi')!.per100g.omega3, 2300, 50), 'cá hồi omega3')
  assert(close(getFood('dau-phu')!.per100g.calcium, 200, 30), 'đậu phụ canxi')
  assert(close(getFood('ca-moi')!.per100g.calcium, 382, 30), 'cá mòi canxi')
})

test('đủ nhóm thực phẩm, mỗi nhóm ≥5', () => {
  for (const g of FOOD_GROUPS) {
    const c = FOODS.filter((f) => f.group === g).length
    assert(c >= 5, `nhóm ${g} chỉ có ${c} thực phẩm`)
  }
})

// ---- 2. MÓN ĂN ----
test(`có ≥40 món ăn (được ${MEALS.length})`, () => {
  assert(MEALS.length >= 40, `MEALS.length = ${MEALS.length}`)
})

test('id món duy nhất; mealType/trimester hợp lệ', () => {
  const ids = MEALS.map((m) => m.id)
  assert(new Set(ids).size === ids.length, 'trùng id món')
  for (const m of MEALS) {
    assert(MEAL_TYPES.includes(m.mealType), `mealType không hợp lệ (${m.id})`)
    assert(m.trimester.length > 0, `${m.id} thiếu trimester`)
    for (const t of m.trimester) {
      assert(TRIMESTERS.includes(t), `${m.id} trimester không hợp lệ (${t})`)
    }
    assert(m.tags.length > 0, `${m.id} thiếu tags`)
    assert(!!m.serving, `${m.id} thiếu serving`)
    assert(!!m.note, `${m.id} thiếu note`)
  }
})

test('nguyên liệu món trỏ tới food id tồn tại', () => {
  for (const m of MEALS) {
    assert(m.ingredients.length > 0, `${m.id} không có nguyên liệu`)
    for (const ing of m.ingredients) {
      assert(ing.amountG > 0, `${m.id}: lượng ${ing.foodId} phải > 0`)
      assert(!!getFood(ing.foodId), `${m.id}: food "${ing.foodId}" không tồn tại`)
    }
  }
})

test('tổng dinh dưỡng của món = tính lại từ nguyên liệu (khớp mọi trường)', () => {
  for (const m of MEALS) {
    const recomputed = computeMealNutrition(m.ingredients)
    for (const k of Object.keys(m.nutrition) as (keyof FoodNutrition)[]) {
      assert(
        close(m.nutrition[k], recomputed[k], 0.05),
        `${m.id}.${k}: lưu ${m.nutrition[k]} ≠ tính lại ${recomputed[k]}`,
      )
    }
  }
})

test('món ăn trong khoảng năng lượng hợp lý (60–1500 kcal)', () => {
  for (const m of MEALS) {
    assert(
      m.nutrition.kcal >= 60 && m.nutrition.kcal <= 1500,
      `${m.id}: kcal = ${m.nutrition.kcal} ngoài khoảng 60–1500`,
    )
    for (const k of Object.keys(m.nutrition) as (keyof FoodNutrition)[]) {
      assert(Number.isFinite(m.nutrition[k]) && m.nutrition[k] >= 0, `${m.id}.${k} không hợp lệ`)
    }
  }
})

test('đối chiếu tay 1 món đơn giản (khoai lang luộc: 200 g khoai + 5 g vừng)', () => {
  const m = MEALS.find((x) => x.id === 'khoai-lang-luoc')
  assert(!!m, 'không tìm thấy món khoai-lang-luoc')
  const expected: FoodNutrition = {
    kcal: 208.7,
    protein: 4.9,
    carb: 42.6,
    fat: 2.9,
    fiber: 7.2,
    iron: 2.1,
    calcium: 108.8,
    folate: 16.9,
    vitaminC: 4.8,
    vitaminD: 0,
    zinc: 1.2,
    iodine: 0,
    omega3: 0,
    sodium: 72.6,
    sugar: 13,
  }
  for (const k of Object.keys(expected) as (keyof FoodNutrition)[]) {
    assert(close(m!.nutrition[k], expected[k], 0.35), `khoai-lang-luoc.${k} = ${m!.nutrition[k]}, kỳ vọng ~${expected[k]}`)
  }
})

test('đối chiếu tay 1 món giàu sắt (canh rau ngót thịt băm): sắt ≥ 3 mg', () => {
  const m = MEALS.find((x) => x.id === 'canh-rau-ngot-thit-bam')
  assert(!!m, 'không tìm thấy món canh-rau-ngot-thit-bam')
  assert(m!.nutrition.iron >= 3, `sắt = ${m!.nutrition.iron} — rau ngót 150g + thịt 50g phải ≥3 mg`)
  assert(m!.nutrition.folate >= 60, `folate = ${m!.nutrition.folate} — rau ngót giàu folate`)
})

test('phủ các nhóm món: đủ sáng/trưa/tối/phụ + món cá béo DHA', () => {
  for (const mt of MEAL_TYPES) {
    const c = MEALS.filter((m) => m.mealType === mt).length
    assert(c >= 1, `không có món loại ${mt}`)
  }
  const dha = MEALS.filter((m) => m.nutrition.omega3 >= 500)
  assert(dha.length >= 3, `chỉ ${dha.length} món giàu DHA (cần ≥3)`)
})

console.log(`\n✅ foods-meals check OK — ${n} test`)
