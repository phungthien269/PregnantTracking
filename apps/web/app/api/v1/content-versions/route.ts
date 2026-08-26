import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'

const CONTENT_TYPES = ['article', 'weekly_guide', 'knowledge_source'] as const

// GET /api/v1/content-versions?contentType=article&contentId=<uuid> — lịch sử
// phiên bản nội dung (Phase 6, hiển thị source/version cho nội dung có bản).
export async function GET(req: Request): Promise<Response> {
  const params = new URL(req.url).searchParams
  const schema = z.object({
    contentType: z.enum(CONTENT_TYPES),
    contentId: z.string().uuid(),
  })
  const parsed = schema.safeParse({
    contentType: params.get('contentType'),
    contentId: params.get('contentId'),
  })
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'contentType/contentId không hợp lệ', parsed.error.flatten())
  }
  return apiOk(await data.getContentVersions(parsed.data.contentType, parsed.data.contentId))
}
