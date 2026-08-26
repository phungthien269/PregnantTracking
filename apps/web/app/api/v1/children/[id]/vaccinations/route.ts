import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'
import { dateSchema } from '@mevabe/domain'

const vaccinationInputSchema = z.object({
  vaccine_name: z.string().min(1).max(120),
  dose_number: z.number().int().positive().optional(),
  scheduled_date: dateSchema.optional(),
  administered_date: dateSchema.optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
})

// GET /api/v1/children/[id]/vaccinations — lịch tiêm chủng.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  return apiOk(await data.getVaccinations(id.id))
}

// POST /api/v1/children/[id]/vaccinations — ghi 1 mũi tiêm (persist SQLite).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(vaccinationInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addVaccination(id.id, parsed.data), 201)
}
