import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

const taskInputSchema = z.object({
  title: z.string().min(1).max(200),
  due_date: z.string().date().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
})

// GET /api/v1/tasks — việc cần làm của gia đình.
export async function GET(): Promise<Response> {
  return apiOk(await data.getTasks())
}

// POST /api/v1/tasks — tạo việc mới.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(taskInputSchema, body)
  if (!parsed.ok) return parsed.error
  const task = await data.addTask(parsed.data)
  return apiOk(task, 201)
}
