import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'

// PATCH /api/v1/tasks/[id] — đánh dấu hoàn thành/chưa { done: boolean }.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(z.object({ done: z.boolean() }), body)
  if (!parsed.ok) return parsed.error
  await data.toggleTask(id.id, parsed.data.done)
  return apiOk({ id: id.id, done: parsed.data.done })
}
