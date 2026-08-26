import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'

const periodSchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
})

// GET /api/v1/daily-intake/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Tổng vi chất theo kỳ + so nhu cầu tuần thai hiện tại (% đủ/thiếu).
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (!from || !to) return apiError('VALIDATION_ERROR', 'Cần tham số from và to (YYYY-MM-DD)')
  const parsed = periodSchema.safeParse({ from, to })
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'from/to phải dạng YYYY-MM-DD', parsed.error.flatten())
  }
  if (parsed.data.from > parsed.data.to) {
    return apiError('VALIDATION_ERROR', 'from phải nhỏ hơn hoặc bằng to')
  }
  return apiOk(await data.getNutrientSummary(parsed.data))
}
