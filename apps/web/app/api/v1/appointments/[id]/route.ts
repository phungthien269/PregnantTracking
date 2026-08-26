import { z } from 'zod'
import { APPOINTMENT_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'

const appointmentUpdateSchema = z.object({
  type: z.enum(APPOINTMENT_TYPES).optional(),
  scheduled_at: z.string().datetime({ offset: true }).optional(),
  location: z.string().max(200).nullable().optional(),
  doctor: z.string().max(120).nullable().optional(),
  summary_before: z.string().max(3000).nullable().optional(),
  outcome: z.string().max(3000).nullable().optional(),
  followup_at: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(3000).nullable().optional(),
  prescription: z.string().max(2000).nullable().optional(),
  tasks_after: z.array(z.string().max(200)).nullable().optional(),
})

// PATCH /api/v1/appointments/[id] — cập nhật lịch khám (mọi trường tuỳ chọn;
// null để xoá, không gửi để giữ nguyên). Phase 6: ghi outcome/prescription/tasks_after sau khám.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(appointmentUpdateSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.updateAppointment(id.id, parsed.data))
}
