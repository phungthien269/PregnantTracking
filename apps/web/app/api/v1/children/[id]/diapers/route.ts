import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'
import { diaperTypeSchema } from '@mevabe/domain'

// GET /api/v1/children/[id]/diapers — nhật ký tã.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  return apiOk(await data.getDiapers(id.id))
}

const diaperInputSchema = z.object({
  changed_at: z.string().datetime({ offset: true }),
  type: diaperTypeSchema,
  note: z.string().max(1000).optional(),
})

// POST /api/v1/children/[id]/diapers — ghi tã (persist SQLite).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(diaperInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addDiaper(id.id, parsed.data), 201)
}
