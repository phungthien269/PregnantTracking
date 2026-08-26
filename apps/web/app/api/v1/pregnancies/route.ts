import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// GET /api/v1/pregnancies — hành trình thai kỳ hiện tại (mock: có sẵn).
export async function GET(): Promise<Response> {
  const pregnancy = await data.getPregnancy()
  return apiOk(pregnancy)
}

const startPregnancySchema = z.object({
  lmp: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'LMP phải đúng YYYY-MM-DD'),
  edd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'EDD phải đúng YYYY-MM-DD').nullable().optional(),
  fetalCount: z.number().int().min(1).max(3).optional(),
})

// POST /api/v1/pregnancies — tạo thai kỳ mới (onboarding, persist SQLite).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(startPregnancySchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.startPregnancy(parsed.data), 201)
}
