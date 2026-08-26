import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'
import { dateSchema, genderSchema, idSchema } from '@mevabe/domain'

const childInputSchema = z.object({
  birth_record_id: idSchema.optional(),
  name: z.string().min(1).max(120),
  sex: genderSchema,
  birth_date: dateSchema,
  birth_weight_kg: z.number().positive().optional(),
  birth_length_cm: z.number().positive().optional(),
  head_circumference_cm: z.number().positive().optional(),
  blood_type: z.string().max(10).optional(),
  allergies: z.array(z.string().max(100)).optional(),
})

// GET /api/v1/children — danh sách hồ sơ bé.
export async function GET(): Promise<Response> {
  return apiOk(await data.getChildren())
}

// POST /api/v1/children — thêm hồ sơ bé (dữ liệu gia đình, persist SQLite).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(childInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addChild(parsed.data), 201)
}
