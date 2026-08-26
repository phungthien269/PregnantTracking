// ===========================================================================
// Confirm-before-save (chạy được ở client): người dùng đã duyệt/sửa đề xuất →
// validate biên giới + build bản ghi bữa ăn để lưu qua data.addMeal.
// ===========================================================================

import { z } from 'zod'
import { mealTypeEnumSchema, type MealTypeValue } from './constants'

export const mealConfirmInputSchema = z.object({
  meal_type: mealTypeEnumSchema,
  name: z.string().min(1).max(200),
  calories: z.number().int().nonnegative().nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
})
export type MealConfirmInput = z.infer<typeof mealConfirmInputSchema>

/** Khớp cấu trúc MealEntryInput của DataApi (apps/web/lib/data/api.ts). */
export interface MealEntryDraft {
  meal_type: MealTypeValue
  name: string
  logged_at: string
  calories?: number
  note?: string
}

export function buildMealEntryInput(confirmed: MealConfirmInput): MealEntryDraft {
  const data = mealConfirmInputSchema.parse(confirmed)
  return {
    meal_type: data.meal_type,
    name: data.name.trim(),
    logged_at: new Date().toISOString(),
    // `ponytail:` MealPhotoUpload.tsx (UI, ngoài scope Agent C/3) cần truyền
    // `calories: proposal.calories ?? undefined` vào đây để lưu — nếu không, calories
    // chỉ là advisory không persist.
    calories: data.calories ?? undefined,
    note: data.note?.trim() || undefined,
  }
}
