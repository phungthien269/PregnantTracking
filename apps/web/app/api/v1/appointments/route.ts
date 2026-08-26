import { z } from 'zod'
import { APPOINTMENT_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// GET /api/v1/appointments — lịch khám (mẫu theo mốc + cá nhân hóa).
export async function GET(): Promise<Response> {
  return apiOk(await data.getAppointments())
}

const appointmentInputSchema = z.object({
  type: z.enum(APPOINTMENT_TYPES),
  scheduled_at: z.string().datetime({ offset: true }),
  location: z.string().max(200).nullable().optional(),
  doctor: z.string().max(120).nullable().optional(),
  summary_before: z.string().max(3000).nullable().optional(),
  outcome: z.string().max(3000).nullable().optional(),
  followup_at: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(3000).nullable().optional(),
  prescription: z.string().max(2000).nullable().optional(),
  tasks_after: z.array(z.string().max(200)).nullable().optional(),
})

// POST /api/v1/appointments — tạo lịch khám mới (persist SQLite).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(appointmentInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addAppointment(parsed.data), 201)
}
