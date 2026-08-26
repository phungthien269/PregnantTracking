import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'
import { birthTypeSchema, dateSchema, idSchema } from '@mevabe/domain'

// PATCH /api/v1/birth-record/[id] — sửa bản ghi sinh (mọi trường tuỳ chọn;
// không gửi để giữ nguyên, null để xoá). KHÔNG cho phép birth_date/birth_type rỗng.
const birthRecordUpdateSchema = z.object({
  pregnancy_id: idSchema.optional(),
  birth_date: dateSchema.optional(),
  birth_type: birthTypeSchema.optional(),
  hospital: z.string().max(200).optional(),
  duration_hours: z.number().positive().optional(),
  complications: z.array(z.string().max(100)).optional(),
  notes: z.string().max(2000).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(birthRecordUpdateSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.updateBirthRecord(id.id, parsed.data))
}
