import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

const healthProfileInputSchema = z.object({
  height_cm: z.number().min(80).max(250).optional(),
  pre_pregnancy_weight_kg: z.number().min(20).max(300).optional(),
  blood_type: z.string().max(5).optional(),
  allergies: z.array(z.string()).max(100).optional(),
  preexisting_conditions: z.array(z.string()).max(100).optional(),
  notes: z.string().max(1000).optional(),
})

// PATCH /api/v1/health-profile — cập nhật hồ sơ sức khỏe (persist SQLite).
export async function PATCH(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(healthProfileInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.updateHealthProfile(parsed.data))
}
