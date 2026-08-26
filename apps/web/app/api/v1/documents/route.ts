import { data } from '@/lib/data'
import { apiOk } from '@/lib/api-utils'

// GET /api/v1/documents — tài liệu khám (giấy kết quả, ảnh).
export async function GET(): Promise<Response> {
  return apiOk(await data.getDocuments())
}
