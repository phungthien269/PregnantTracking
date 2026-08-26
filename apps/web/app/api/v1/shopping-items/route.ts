import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// GET /api/v1/shopping-items — danh sách đồ dùng cần mua.
export async function GET(): Promise<Response> {
  return apiOk(await data.getShopping())
}

const shoppingInputSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(60).nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  estimated_price: z.number().positive().nullable().optional(),
})

// POST /api/v1/shopping-items — thêm món cần mua (persist SQLite).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(shoppingInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addShoppingItem(parsed.data), 201)
}
