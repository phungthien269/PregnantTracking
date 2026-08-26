import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'
import { sleepPlaceSchema } from '@mevabe/domain'

// GET /api/v1/children/[id]/sleeps — giấc ngủ của bé.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  return apiOk(await data.getSleeps(id.id))
}

const sleepInputSchema = z.object({
  started_at: z.string().datetime({ offset: true }),
  ended_at: z.string().datetime({ offset: true }).nullable().optional(),
  place: sleepPlaceSchema,
  note: z.string().max(1000).optional(),
})

// POST /api/v1/children/[id]/sleeps — ghi giấc ngủ (persist SQLite).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(sleepInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addSleep(id.id, parsed.data), 201)
}
