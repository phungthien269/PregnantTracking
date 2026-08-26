import { z } from 'zod'
import { BUDGET_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// GET /api/v1/budget — danh sách thu/chi (budget_entries).
export async function GET(): Promise<Response> {
  return apiOk(await data.getBudget())
}

const budgetInputSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().nonnegative(),
  type: z.enum(BUDGET_TYPES),
  category: z.string().max(80).nullable().optional(),
  occurred_at: z.string().date(),
  note: z.string().max(500).nullable().optional(),
})

// POST /api/v1/budget — thêm khoản thu/chi.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(budgetInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addBudget(parsed.data), 201)
}
