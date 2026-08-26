import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'

// GET /api/v1/daily-intake/history?limit=30 — lịch sử nhật ký dinh dưỡng
// (mới nhất trước, mặc định 30).
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
