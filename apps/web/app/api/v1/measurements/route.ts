import { z } from 'zod'
import { MEASUREMENT_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

const measurementInputSchema = z.object({
  type: z.enum(MEASUREMENT_TYPES),
  value: z.number(),
  unit: z.string().min(1).max(20),
  taken_at: z.string().datetime({ offset: true }),
  note: z.string().max(1000).optional(),
})

// GET /api/v1/measurements — các chỉ số mẹ theo dõi.
export async function GET(): Promise<Response> {
  return apiOk(await data.getMeasurements())
}

// POST /api/v1/measurements — ghi chỉ số mới.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(measurementInputSchema, body)
  if (!parsed.ok) return parsed.error
  const measurement = await data.addMeasurement(parsed.data)
  return apiOk(measurement, 201)
}
