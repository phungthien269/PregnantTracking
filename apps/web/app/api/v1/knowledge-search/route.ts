import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'

// GET /api/v1/knowledge-search?q=... — tìm chunk tri thức (LIKE đơn giản
// trên content/citation). Phase 6: retrieval cho thư viện.
export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (!q.trim()) return apiOk([])
  const parsed = z.string().max(200).safeParse(q)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'q phải là chuỗi ≤ 200 ký tự', parsed.error.flatten())
  }
  return apiOk(await data.searchKnowledgeChunks(parsed.data))
}
