import { z } from 'zod'
import { GENDERS } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// GET /api/v1/fetuses — danh sách thai nhi (hỗ trợ đa thai từ đầu).
export async function GET(): Promise<Response> {
  return apiOk(await data.getFetuses())
}

const fetusInputSchema = z.object({
  name: z.string().max(60).nullable().optional(),
  sex: z.enum(GENDERS).optional(),
  birth_order: z.number().int().min(1).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

// POST /api/v1/fetuses — thêm thai nhi vào thai kỳ hiện tại (đa thai).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(fetusInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addFetus(parsed.data), 201)
}
