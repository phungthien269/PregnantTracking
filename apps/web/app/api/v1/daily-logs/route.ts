import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'

// GET /api/v1/daily-logs?date=YYYY-MM-DD — tổng hợp nhật ký trong ngày.
export async function GET(req: Request): Promise<Response> {
  const raw = new URL(req.url).searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const parsed = z.string().date().safeParse(raw)
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'date phải dạng YYYY-MM-DD', parsed.error.flatten())
  const [meals, measurements, symptoms] = await Promise.all([
    data.getMealsByDate(parsed.data),
    data.getMeasurements(),
    data.getSymptoms(),
  ])
  return apiOk({ date: parsed.data, meals, measurements, symptoms })
}
