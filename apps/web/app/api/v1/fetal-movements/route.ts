import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'
import { fetalMovementFeelingSchema } from '@mevabe/domain'

// GET /api/v1/fetal-movements — nhật ký thai máy.
export async function GET(): Promise<Response> {
  return apiOk(await data.getFetalMovementLogs())
}

const fetalMovementInputSchema = z.object({
  felt_at: z.string().datetime({ offset: true }),
  feeling: fetalMovementFeelingSchema,
  duration_min: z.number().positive().nullable().optional(),
  note: z.string().max(1000).optional(),
})

// POST /api/v1/fetal-movements — ghi thai máy (persist SQLite).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(fetalMovementInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addFetalMovement(parsed.data), 201)
}
