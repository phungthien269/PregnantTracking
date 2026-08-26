import { z } from 'zod'

// ===========================================================================
// Hằng số dùng chung cho module meals-photo. Tách riêng để confirm.ts (chạy ở
// client) và recognize.ts (chạy ở server) dùng chung mà không kéo server-only
// code vào bundle client. Giữ đồng bộ với @mevabe/domain MEAL_TYPES.
// ===========================================================================

export const MEAL_TYPE_VALUES = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'] as const
export const mealTypeEnumSchema = z.enum(MEAL_TYPE_VALUES)
export type MealTypeValue = z.infer<typeof mealTypeEnumSchema>
