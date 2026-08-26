import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'

// PATCH /api/v1/reminders/[id] — tắt/bật nhắc đo (ngừng theo dõi tình trạng).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(z.object({ active: z.boolean().optional() }), body)
  if (!parsed.ok) return parsed.error
  const reminder = await data.updateReminder(id.id, parsed.data)
  return apiOk(reminder)
}
