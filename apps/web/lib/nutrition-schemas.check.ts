// ===========================================================================
// nutrition-schemas.check.ts — test biên Zod của module dinh dưỡng
// (@mevabe/domain, packages/domain/src/nutrition/index.ts) chạy từ web runtime.
// Lý do để ở đây: test-domain.sh (shared loader) không nạp được nutrition/index.ts
// vì nó dùng directory import `../pregnancy` → loader riêng của test-web.sh
// (scripts/test-web-loader.mjs) có fallback `/index.ts` nên nạp được `@mevabe/domain` thật.
// Chạy: scripts/test-web.sh.
// ===========================================================================

import {
  idSchema,
  mealTypeSchema,
  hydrationLogSchema,
  caffeineLogSchema,
  mealEntrySchema,
  foodPreferenceSchema,
  MEAL_TYPES,
} from '@mevabe/domain'

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

// Đủ field của baseEntitySchema (+ source cho withSource)
const BASE = {
  id: '40000000-0000-0000-0000-0000000000aa',
  family_id: '40000000-0000-0000-0000-0000000000aa',
  private_owner_id: null,
  created_at: '2026-08-04T09:00:00+07:00',
  updated_at: '2026-08-04T09:00:00+07:00',
  source: 'manual',
}

// ---- idSchema ----
test('idSchema: UUID hợp lệ ok, không hợp lệ fail', () => {
  assert(idSchema.safeParse('40000000-0000-0000-0000-0000000000aa').success, 'uuid ok')
  assert(idSchema.safeParse('abc').success === false, 'abc fail')
  assert(idSchema.safeParse('').success === false, 'rỗng fail')
})

// ---- mealTypeSchema ----
test('mealTypeSchema: 5 loại hợp lệ, loại lạ fail', () => {
  for (const v of MEAL_TYPES) assert(mealTypeSchema.safeParse(v).success, `${v} ok`)
  assert(mealTypeSchema.safeParse('supper').success === false, 'supper fail')
})

// ---- hydrationLogSchema: amount_ml phải là số nguyên dương ----
test('hydrationLogSchema: amount_ml > 0 ok; 0/âm/không nguyên fail', () => {
  const ok = { logged_at: '2026-08-04T09:00:00+07:00', ...BASE }
  assert(hydrationLogSchema.safeParse({ ...ok, amount_ml: 250 }).success, '250 ok')
  assert(hydrationLogSchema.safeParse({ ...ok, amount_ml: 0 }).success === false, '0 fail')
  assert(hydrationLogSchema.safeParse({ ...ok, amount_ml: -100 }).success === false, '-100 fail')
  assert(hydrationLogSchema.safeParse({ ...ok, amount_ml: 250.5 }).success === false, '250.5 fail (phải nguyên)')
})

// ---- caffeineLogSchema: amount_mg không âm ----
test('caffeineLogSchema: amount_mg ≥ 0 ok; âm fail', () => {
  const ok = { logged_at: '2026-08-04T09:00:00+07:00', ...BASE }
  assert(caffeineLogSchema.safeParse({ ...ok, amount_mg: 0 }).success, '0 ok')
  assert(caffeineLogSchema.safeParse({ ...ok, amount_mg: 200 }).success, '200 ok')
  assert(caffeineLogSchema.safeParse({ ...ok, amount_mg: -1 }).success === false, '-1 fail')
})

// ---- mealEntrySchema: meal_type/name bắt buộc đúng ----
test('mealEntrySchema: meal_type hợp lệ ok; loại lạ / thiếu name fail', () => {
  const ok = { meal_type: 'lunch', name: 'Cơm cá', logged_at: '2026-08-04T09:00:00+07:00', calories: 500, note: null, ...BASE }
  assert(mealEntrySchema.safeParse(ok).success, 'hợp lệ ok')
  assert(mealEntrySchema.safeParse({ ...ok, meal_type: 'supper' }).success === false, 'supper fail')
  assert(mealEntrySchema.safeParse({ ...ok, name: '' }).success === false, 'name rỗng fail')
  assert(mealEntrySchema.safeParse({ ...ok, calories: -1 }).success === false, 'calories âm fail')
})

// ---- foodPreferenceSchema: preference phải là like/dislike ----
test('foodPreferenceSchema: preference like/dislike ok; giá trị khác fail', () => {
  const ok = { item: 'Sầu riêng', preference: 'like', note: null, ...BASE }
  assert(foodPreferenceSchema.safeParse(ok).success, 'like ok')
  assert(foodPreferenceSchema.safeParse({ ...ok, preference: 'dislike' }).success, 'dislike ok')
  assert(foodPreferenceSchema.safeParse({ ...ok, preference: 'meh' }).success === false, 'meh fail')
})

console.log(`\n✅ nutrition-schemas.check OK — ${n} test`)
