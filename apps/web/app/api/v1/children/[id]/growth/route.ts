import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'
import { dateSchema } from '@mevabe/domain'

const growthPointInputSchema = z.object({
  date: dateSchema,
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  headCm: z.number().positive().optional(),
})

// GET /api/v1/children/[id]/growth — tăng trưởng (cân nặng/chiều dài/vòng đầu).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  return apiOk(await data.getGrowth(id.id))
}

// POST /api/v1/children/[id]/growth — ghi 1 điểm tăng trưởng (persist SQLite).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(growthPointInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addGrowthPoint(id.id, parsed.data), 201)
}
