import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// GET /api/v1/conditions/measurements — nhật ký chỉ số của các kế hoạch tình trạng.
export async function GET(): Promise<Response> {
  return apiOk(await data.getConditionMeasurements())
}

const conditionMeasurementSchema = z.object({
  condition_plan_id: z.string().uuid(),
  type: z.string().min(1).max(80),
  value: z.number(),
  unit: z.string().max(20),
  measured_at: z.string().datetime({ offset: true }),
  note: z.string().max(500).nullable().optional(),
})

// POST /api/v1/conditions/measurements — ghi chỉ số đo của kế hoạch tình trạng.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(conditionMeasurementSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addConditionMeasurement(parsed.data), 201)
}
