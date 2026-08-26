import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'

// PATCH /api/v1/shopping-items/[id] — sửa món cần mua (mọi trường tuỳ chọn;
// `done` đổi trạng thái mua — tương thích toggleShopping cũ). DELETE → xoá món.
const shoppingUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().max(60).nullable().optional(),
  estimated_price: z.number().nonnegative().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  done: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(shoppingUpdateSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.updateShoppingItem(id.id, parsed.data))
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  await data.deleteShoppingItem(id.id)
  return apiOk({ id: id.id })
}
