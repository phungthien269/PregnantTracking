import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'
import { milestoneStatusSchema } from '@mevabe/domain'

// GET /api/v1/children/[id]/milestones — mốc phát triển của bé.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  return apiOk(await data.getMilestones(id.id))
}

const milestoneInputSchema = z.object({
  name: z.string().min(1).max(100),
  stage: z.string().max(60).nullable().optional(),
  status: milestoneStatusSchema,
  achieved_at: z.string().datetime({ offset: true }).nullable().optional(),
  note: z.string().max(1000).optional(),
})

// POST /api/v1/children/[id]/milestones — ghi mốc (persist SQLite).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(milestoneInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addMilestone(id.id, parsed.data), 201)
}
