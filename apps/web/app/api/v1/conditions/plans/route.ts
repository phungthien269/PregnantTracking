import { z } from 'zod'
import { CONDITION_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// GET /api/v1/conditions/plans — danh sách kế hoạch theo dõi tình trạng.
export async function GET(): Promise<Response> {
  return apiOk(await data.getConditionPlans())
}

const conditionPlanSchema = z.object({
  condition_type: z.enum(CONDITION_TYPES),
  plan_text: z.string().min(1).max(4000),
  start_date: z.string().date().nullable().optional(),
  end_date: z.string().date().nullable().optional(),
  doctor_notes: z.string().max(2000).nullable().optional(),
})

// POST /api/v1/conditions/plans — tạo kế hoạch theo dõi cho một tình trạng.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(conditionPlanSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addConditionPlan(parsed.data), 201)
}
