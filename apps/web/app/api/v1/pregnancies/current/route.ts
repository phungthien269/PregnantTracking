import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError, parseBody } from '@/lib/api-utils'

const updateSchema = z
  .object({
    /** Ngày đầu kỳ kinh cuối (YYYY-MM-DD). Chọn tuần thai = đổi LMP/EDD. */
    lmp: z.string().date().optional(),
    /** Ngày dự sinh (YYYY-MM-DD). */
    edd: z.string().date().optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((v) => v.lmp !== undefined || v.edd !== undefined || v.notes !== undefined, {
    message: 'Cần ít nhất một trường để cập nhật (lmp/edd/notes)',
  })
  .refine((v) => !(v.lmp && v.edd && v.edd <= v.lmp), {
    message: 'Ngày dự sinh (EDD) phải sau ngày đầu kỳ kinh cuối (LMP)',
    path: ['edd'],
  })

// PATCH /api/v1/pregnancies/current — cập nhật thai kỳ hiện tại (chọn tuần thai).
// Chỉ nhập LMP → EDD tái tính theo Naegele; chỉ EDD → LMP tái tính ngược.
export async function PATCH(req: Request): Promise<Response> {
  const parsed = parseBody(updateSchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  try {
    const pregnancy = await data.updatePregnancy(parsed.data)
    return apiOk(pregnancy)
  } catch (err) {
    return apiError('PREGNANCY_NOT_FOUND', (err as Error).message, undefined, 404)
  }
}
