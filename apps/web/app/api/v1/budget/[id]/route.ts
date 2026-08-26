import { z } from 'zod'
import { BUDGET_TYPES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'

const budgetUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  amount: z.number().nonnegative().optional(),
  type: z.enum(BUDGET_TYPES).optional(),
  category: z.string().max(80).nullable().optional(),
  occurred_at: z.string().date().optional(),
  note: z.string().max(500).nullable().optional(),
})

// PATCH /api/v1/budget/[id] — cập nhật khoản thu/chi.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(budgetUpdateSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.updateBudget(id.id, parsed.data))
}
