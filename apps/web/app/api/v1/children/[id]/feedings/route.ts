import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'
import { feedingMethodSchema, feedingSideSchema } from '@mevabe/domain'

// GET /api/v1/children/[id]/feedings — nhật ký bú.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  return apiOk(await data.getFeedings(id.id))
}

const feedingInputSchema = z.object({
  method: feedingMethodSchema,
  amount_ml: z.number().positive().nullable().optional(),
  started_at: z.string().datetime({ offset: true }),
  duration_min: z.number().positive().nullable().optional(),
  side: feedingSideSchema.nullable().optional(),
  note: z.string().max(1000).optional(),
})

// POST /api/v1/children/[id]/feedings — ghi cữ bú (persist SQLite).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(feedingInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addFeeding(id.id, parsed.data), 201)
}
