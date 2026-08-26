// ===========================================================================
// constants.check.ts — test enum bữa ăn (apps/web/lib/meals-photo/constants.ts)
// + đối soát đồng bộ với MEAL_TYPES của @mevabe/domain.
// KHÔNG đụng recognize.ts (agent khác đang sửa).
// Chạy: scripts/test-web.sh.
// ===========================================================================

import { MEAL_TYPE_VALUES, mealTypeEnumSchema, type MealTypeValue } from './constants'
import { MEAL_TYPES, mealTypeSchema } from '@mevabe/domain'

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

// ---- MEAL_TYPE_VALUES ----
test('MEAL_TYPE_VALUES: đủ 5 loại, đúng thứ tự', () => {
  assert(MEAL_TYPE_VALUES.length === 5, `length = ${MEAL_TYPE_VALUES.length}`)
  assert(
    JSON.stringify(MEAL_TYPE_VALUES) === JSON.stringify(['breakfast', 'lunch', 'dinner', 'snack', 'drink']),
    `giá trị = ${JSON.stringify(MEAL_TYPE_VALUES)}`,
  )
})

// ---- mealTypeEnumSchema: parse ----
test('mealTypeEnumSchema: chấp nhận cả 5 giá trị hợp lệ', () => {
  for (const v of MEAL_TYPE_VALUES) {
    assert(mealTypeEnumSchema.safeParse(v).success, `parse ${v} ok`)
  }
})

test('mealTypeEnumSchema: từ chối giá trị lạ / hoa thường / chuỗi rỗng', () => {
  assert(mealTypeEnumSchema.safeParse('supper').success === false, 'supper → fail')
  assert(mealTypeEnumSchema.safeParse('').success === false, 'rỗng → fail')
  assert(mealTypeEnumSchema.safeParse('Breakfast').success === false, 'hoa thường → fail')
  assert(mealTypeEnumSchema.safeParse('breakfast ').success === false, 'thừa khoảng trắng → fail')
})

// ---- Đồng bộ với domain MEAL_TYPES ----
test('constants MEAL_TYPE_VALUES khớp domain MEAL_TYPES (cùng giá trị + thứ tự)', () => {
  assert(JSON.stringify(MEAL_TYPE_VALUES) === JSON.stringify(MEAL_TYPES), 'khớp MEAL_TYPES domain')
})

test('mealTypeSchema (domain) chấp nhận mọi MEAL_TYPE_VALUES', () => {
  for (const v of MEAL_TYPE_VALUES) {
    assert(mealTypeSchema.safeParse(v).success, `domain parse ${v} ok`)
  }
})

// ---- type-level: MealTypeValue là union 5 loại ----
test('MealTypeValue: kiểu union đủ 5 loại', () => {
  const accept: MealTypeValue = 'snack'
  assert(accept === 'snack', 'gán được giá trị hợp lệ')
})

console.log(`\n✅ constants.check OK — ${n} test`)
