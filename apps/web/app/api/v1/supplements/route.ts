import { data } from '@/lib/data'
import { apiOk } from '@/lib/api-utils'

// GET /api/v1/supplements — danh sách vitamin/khoáng chất đã xác nhận.
export async function GET(): Promise<Response> {
  return apiOk(await data.getSupplements())
}
