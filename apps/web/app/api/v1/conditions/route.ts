import { z } from 'zod'
import { CONDITION_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// ===========================================================================
// /api/v1/conditions — mô-đun "Tình trạng đặc biệt" thai kỳ (Phase 4A).
// Lưu typed vào nutrition_profiles.conditions + doctor_instructions.
// ===========================================================================

const conditionSchema = z.object({
  conditions: z.array(z.enum(CONDITION_TYPES)).max(7).optional(),
  doctor_instructions: z.string().max(2000).nullable().optional(),
})

// GET /api/v1/conditions — tình trạng đang khai báo + ghi chú bác sĩ.
export async function GET(): Promise<Response> {
  const np = await data.getNutritionProfile()
  return apiOk({
    conditions: np?.conditions ?? [],
    doctor_instructions: np?.doctor_instructions ?? null,
  })
}

// PATCH /api/v1/conditions — khai báo/bỏ tình trạng + cập nhật ghi chú bác sĩ.
export async function PATCH(req: Request): Promise<Response> {
  const parsed = parseBody(conditionSchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  const np = await data.updateNutritionProfile(parsed.data)
  return apiOk({ conditions: np.conditions, doctor_instructions: np.doctor_instructions })
}
