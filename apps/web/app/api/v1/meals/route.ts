import { z } from 'zod'
import { MEAL_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, apiError, parseBody } from '@/lib/api-utils'

const mealInputSchema = z.object({
  meal_type: z.enum(MEAL_TYPES),
  name: z.string().min(1).max(200),
  logged_at: z.string().datetime({ offset: true }),
  note: z.string().max(1000).optional(),
})

// GET /api/v1/meals — nhật ký bữa ăn (có ?date=YYYY-MM-DD để lọc theo ngày).
export async function GET(req: Request): Promise<Response> {
  const date = new URL(req.url).searchParams.get('date')
  if (date) {
    const parsed = z.string().date().safeParse(date)
    if (!parsed.success)
      return apiError('VALIDATION_ERROR', 'date phải dạng YYYY-MM-DD', parsed.error.flatten())
    return apiOk(await data.getMealsByDate(parsed.data))
  }
  return apiOk(await data.getMeals())
}

// POST /api/v1/meals — ghi nhanh bữa ăn.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(mealInputSchema, body)
  if (!parsed.ok) return parsed.error
  const meal = await data.addMeal(parsed.data)
  return apiOk(meal, 201)
}
