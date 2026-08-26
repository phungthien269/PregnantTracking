import { z } from 'zod'
import { bloodTypeSchema } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, apiError, parseBody } from '@/lib/api-utils'

const profileSchema = z.object({
  height_cm: z.number().positive().optional(),
  pre_pregnancy_weight_kg: z.number().positive().optional(),
  blood_type: bloodTypeSchema.optional(),
  allergies: z.array(z.string().max(100)).optional(),
  preexisting_conditions: z.array(z.string().max(100)).optional(),
  notes: z.string().max(2000).optional(),
})

// PATCH /api/v1/import/profile — cập nhật hồ sơ sức khỏe cá nhân (health_profiles).
export async function PATCH(req: Request): Promise<Response> {
  const parsed = parseBody(profileSchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  try {
    const profile = await data.updateHealthProfile(parsed.data)
    return apiOk(profile)
  } catch (err) {
    return apiError('PROFILE_NOT_FOUND', (err as Error).message, undefined, 404)
  }
}
