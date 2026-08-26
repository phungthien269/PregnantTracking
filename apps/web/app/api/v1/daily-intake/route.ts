import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError, parseBody } from '@/lib/api-utils'
import { computeItemNutrition } from '@/lib/nutrition/intake-calcs'
import { estimateItemNutrients } from '@/lib/ai/intake-estimator'
import type { IntakeItemInput } from '@/lib/data/api'

// ===========================================================================
// /api/v1/daily-intake — nhật ký dinh dưỡng hằng ngày (Agent 6J).
// POST: tạo log (items đã tính vi chất: số liệu thật MEALS/FOODS, hoặc AI ước
//       tính cho món không rõ — không có key/mạng thì để trống + estimated=true).
// GET:  danh sách log mới nhất trước (?limit=, mặc định 30).
// ===========================================================================

const intakeItemSchema = z.object({
  kind: z.enum(['meal', 'food', 'custom', 'supplement']),
  name: z.string().min(1).max(200),
  ref_id: z.string().max(100).nullish(),
  amount_g: z.number().nonnegative().max(10_000).nullish(),
  qty: z.number().positive().max(100).nullish(),
  dose_mg: z.number().nonnegative().max(100_000).nullish(),
  pills: z.number().positive().max(1000).nullish(),
  note: z.string().max(1000).nullish(),
})

const intakeInputSchema = z.object({
  date: z.string().date(),
  note: z.string().max(2000).nullish(),
  items: z.array(intakeItemSchema).min(1).max(50),
})

// GET /api/v1/daily-intake?limit=30 — danh sách nhật ký (mới nhất trước).
export async function GET(req: Request): Promise<Response> {
  const limitRaw = new URL(req.url).searchParams.get('limit')
  if (limitRaw !== null) {
    const parsed = z.coerce.number().int().min(1).max(100).safeParse(limitRaw)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'limit phải là số nguyên 1–100', parsed.error.flatten())
    }
    return apiOk(await data.listIntakeHistory(parsed.data))
  }
  return apiOk(await data.listIntakeHistory())
}

// POST /api/v1/daily-intake — tạo nhật ký dinh dưỡng 1 ngày.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(intakeInputSchema, body)
  if (!parsed.ok) return parsed.error

  // Tính vi chất từng item: món có trong MEALS/FOODS/TPCN nhận diện được → số liệu
  // thật; món không rõ → AI ước tính (estimated=true). Lỗi AI → nutrients rỗng,
  // vẫn lưu (KHÔNG crash). Chạy server-side nên gọi AI được.
  const prepared: IntakeItemInput[] = []
  for (const item of parsed.data.items) {
    const computed = computeItemNutrition(item)
    let nutrients = computed.nutrients
    if (computed.estimated) {
      const ai = await estimateItemNutrients(item)
      if (ai) nutrients = ai
    }
    prepared.push({ ...item, nutrients, estimated: computed.estimated })
  }

  const log = await data.addDailyIntake({
    date: parsed.data.date,
    note: parsed.data.note ?? undefined,
    items: prepared,
  })
  return apiOk(log, 201)
}
