import { data } from '@/lib/data'
import { apiOk, apiError, parsePathId } from '@/lib/api-utils'

// GET /api/v1/daily-intake/[id] — chi tiết 1 nhật ký dinh dưỡng (kèm items).
// Chỉ chủ sở hữu (hoặc log dùng chung) thấy — data layer tự lọc.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const log = await data.getDailyIntake(id.id)
  if (!log) return apiError('NOT_FOUND', 'Không tìm thấy nhật ký dinh dưỡng', undefined, 404)
  return apiOk(log)
}
