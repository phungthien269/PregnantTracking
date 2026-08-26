import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

const hydrationInputSchema = z.object({
  logged_at: z.string().datetime({ offset: true }),
  amount_ml: z.number().positive().max(5000),
})

// GET /api/v1/hydration — tổng nước/caffeine hôm nay (Phase 7 polish: client đọc thật).
export async function GET(): Promise<Response> {
  return apiOk(await data.getWaterCaffeine())
}

// POST /api/v1/hydration — ghi nước uống (persist SQLite).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(hydrationInputSchema, body)
  if (!parsed.ok) return parsed.error
  await data.addWater(parsed.data)
  return apiOk({ ok: true }, 201)
}
