import { z } from 'zod'
import {
  idSchema,
  baseEntitySchema,
  withSource,
  dietaryPatternSchema,
  conditionTypeSchema,
  mealTypeSchema,
  supplementStatusSchema,
  reminderFrequencySchema,
} from '../core'
import { dateSchema } from '../pregnancy'

// ===========================================================================
// Dinh dưỡng: nutrition_profiles, meal_entries, meal_photos, food_preferences,
// food_safety_flags, supplement_plans, supplement_adherence, condition_plans,
// condition_measurements, saved_meals.
// ===========================================================================

// ---- nutrition_profiles ----
export const nutritionProfileSchema = baseEntitySchema.extend({
  pregnancy_id: idSchema.nullable(),
  dietary_pattern: dietaryPatternSchema,
  allergies: z.array(z.string().max(100)),
  dislikes: z.array(z.string().max(100)),
  budget_per_week: z.number().nonnegative().nullable(),
  cook_time_min: z.number().int().nonnegative().nullable(),
  pre_pregnancy_weight_kg: z.number().positive().nullable(),
  conditions: z.array(conditionTypeSchema),
  doctor_instructions: z.string().max(2000).nullable(),
})
export type NutritionProfile = z.infer<typeof nutritionProfileSchema>

// ---- meal_entries (có thể khóa riêng) ----
export const mealEntrySchema = withSource(
  baseEntitySchema.extend({
    meal_type: mealTypeSchema,
    name: z.string().min(1).max(200),
    logged_at: z.string().datetime({ offset: true }),
    calories: z.number().nonnegative().nullable(),
    note: z.string().max(1000).nullable(),
  }),
)
export type MealEntry = z.infer<typeof mealEntrySchema>

// ---- meal_photos (AI đề xuất, người dùng xác nhận trước khi lưu) ----
export const mealPhotoSchema = baseEntitySchema.extend({
  meal_id: idSchema,
  file_url: z.string().url(),
  ai_suggested_name: z.string().max(200).nullable(),
  confirmed: z.boolean(),
  confirmed_by: idSchema.nullable(),
})
export type MealPhoto = z.infer<typeof mealPhotoSchema>

// ---- food_preferences ----
export const FOOD_PREFERENCES = ['like', 'dislike'] as const
export const foodPreferenceSchema = baseEntitySchema.extend({
  item: z.string().min(1).max(120),
  preference: z.enum(FOOD_PREFERENCES),
  note: z.string().max(500).nullable(),
})
export type FoodPreference = z.infer<typeof foodPreferenceSchema>

// ---- food_safety_flags (từ rules, lưu để hiển thị) ----
export const FOOD_SAFETY_LEVELS = ['avoid', 'limit', 'ok'] as const
export const foodSafetyLevelSchema = z.enum(FOOD_SAFETY_LEVELS)
export type FoodSafetyLevel = z.infer<typeof foodSafetyLevelSchema>

export const foodSafetyFlagSchema = baseEntitySchema.extend({
  food: z.string().min(1).max(120),
  level: foodSafetyLevelSchema,
  reason: z.string().max(500),
  week_from: z.number().int().min(1).max(42).nullable(),
  week_to: z.number().int().min(1).max(42).nullable(),
})
export type FoodSafetyFlag = z.infer<typeof foodSafetyFlagSchema>

// ---- supplement_plans (chỉ nhắc uống khi đã xác nhận) ----
export const supplementPlanSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(120),
  dosage: z.string().max(100),
  unit: z.string().max(40),
  frequency: reminderFrequencySchema,
  start_date: dateSchema.nullable(),
  end_date: dateSchema.nullable(),
  status: supplementStatusSchema,
  prescribed_by: z.string().max(120).nullable(),
  notes: z.string().max(1000).nullable(),
})
export type SupplementPlan = z.infer<typeof supplementPlanSchema>

// ---- supplement_adherence ----
export const adherenceStatusSchema = z.enum(['taken', 'skipped'])
export type AdherenceStatus = z.infer<typeof adherenceStatusSchema>

export const supplementAdherenceSchema = baseEntitySchema.extend({
  supplement_id: idSchema,
  taken_at: z.string().datetime({ offset: true }),
  status: adherenceStatusSchema,
  note: z.string().max(500).nullable(),
})
export type SupplementAdherence = z.infer<typeof supplementAdherenceSchema>

// ---- condition_plans (chỉ bật khi đã khai báo/xác nhận tình trạng) ----
export const conditionPlanSchema = baseEntitySchema.extend({
  condition_type: conditionTypeSchema,
  plan_text: z.string().min(1).max(4000),
  start_date: dateSchema.nullable(),
  end_date: dateSchema.nullable(),
  doctor_notes: z.string().max(2000).nullable(),
})
export type ConditionPlan = z.infer<typeof conditionPlanSchema>

// ---- condition_measurements ----
export const conditionMeasurementSchema = baseEntitySchema.extend({
  condition_plan_id: idSchema,
  type: z.string().min(1).max(80),
  value: z.number(),
  unit: z.string().max(20),
  measured_at: z.string().datetime({ offset: true }),
  note: z.string().max(500).nullable(),
})
export type ConditionMeasurement = z.infer<typeof conditionMeasurementSchema>

// ---- saved_meals (món đã lưu, gợi ý từ món Việt) ----
export const savedMealSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(200),
  meal_type: mealTypeSchema,
  servings: z.string().max(80).nullable(),
  calories: z.number().nonnegative().nullable(),
  ingredients: z.array(z.string().max(100)),
  instructions: z.string().max(4000).nullable(),
  tags: z.array(z.string().max(60)),
})
export type SavedMeal = z.infer<typeof savedMealSchema>

// ---- hydration_logs (nước ghi nhanh mỗi lần uống) ----
export const hydrationLogSchema = withSource(
  baseEntitySchema.extend({
    logged_at: z.string().datetime({ offset: true }),
    amount_ml: z.number().int().positive(),
  }),
)
export type HydrationLog = z.infer<typeof hydrationLogSchema>

// ---- caffeine_logs (caffeine; giới hạn < 200 mg/ngày) ----
export const caffeineLogSchema = withSource(
  baseEntitySchema.extend({
    logged_at: z.string().datetime({ offset: true }),
    amount_mg: z.number().int().nonnegative(),
  }),
)
export type CaffeineLog = z.infer<typeof caffeineLogSchema>
