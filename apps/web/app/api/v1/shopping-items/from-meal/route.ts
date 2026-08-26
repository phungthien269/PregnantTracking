import { z } from 'zod'
import type * as D from '@mevabe/domain'
import { MEAL_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

const mealToShoppingSchema = z.object({
  meal: z.object({
    name: z.string().min(1).max(200),
    meal_type: z.enum(MEAL_TYPES),
    servings: z.string().max(80).nullable().optional(),
    calories: z.number().nonnegative().nullable().optional(),
    ingredients: z.array(z.string().max(100)),
    instructions: z.string().max(4000).nullable().optional(),
    tags: z.array(z.string().max(60)).optional(),
  }),
})

// POST /api/v1/shopping-items/from-meal — tạo 1 shopping item cho mỗi nguyên liệu
// của món (Phase 6, món → mua sắm). Trả các item đã tạo.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(mealToShoppingSchema, body)
  if (!parsed.ok) return parsed.error
  const items = await data.addMealToShopping(parsed.data.meal as D.SavedMeal)
  return apiOk(items, 201)
}
