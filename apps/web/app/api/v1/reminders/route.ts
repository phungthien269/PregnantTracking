import { z } from 'zod'
import { REMINDER_FREQUENCIES, NOTIFICATION_CHANNELS } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// ===========================================================================
// /api/v1/reminders — nhắc nhở đo theo lịch bác sĩ chỉ định (Phase 4A).
// Nối vào hệ reminder có sẵn → /thong-bao (inngest/engine đọc getReminders).
// ===========================================================================

const reminderSchema = z.object({
  title: z.string().min(1).max(200),
  scheduled_at: z.string().datetime({ offset: true }),
  frequency: z.enum(REMINDER_FREQUENCIES),
  channels: z.array(z.enum(NOTIFICATION_CHANNELS)).optional(),
  payload: z.string().max(1000).nullable().optional(),
})

// GET /api/v1/reminders — danh sách nhắc nhở (UI lịch đo đọc schedules).
export async function GET(): Promise<Response> {
  return apiOk(await data.getReminders())
}

// POST /api/v1/reminders — tạo nhắc đo mới.
export async function POST(req: Request): Promise<Response> {
  const parsed = parseBody(reminderSchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  const reminder = await data.addReminder(parsed.data)
  return apiOk(reminder, 201)
}
