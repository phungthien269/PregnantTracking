import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError, parsePathId } from '@/lib/api-utils'
import { libraryStore } from '@/lib/library/store'
import { confirmStage } from '@/lib/library/pipeline'
import { knowledgeStageSchema } from '@mevabe/domain'

// GET /api/v1/knowledge-sources/[id] — chi tiết nguồn: metadata + chunks (citation) + stage tags.
export async function GET(_req: Request, params: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = await parsePathId(params.params)
  if (id.error) return id.error

  const source = (await data.getKnowledgeSources()).find((s) => s.id === id.id)
  if (!source) return apiError('NOT_FOUND', 'Không tìm thấy nguồn', undefined, 404)

  const [chunks, stageTags] = await Promise.all([
    libraryStore.getChunks(id.id),
    libraryStore.listStageTags(id.id),
  ])
  return apiOk({ source, chunks, stageTags })
}

const confirmSchema = z.object({ stage: knowledgeStageSchema })

// PATCH /api/v1/knowledge-sources/[id] — xác nhận giai đoạn (stage tag) do AI/fallback gợi ý.
export async function PATCH(req: Request, params: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = await parsePathId(params.params)
  if (id.error) return id.error

  const parsed = confirmSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'stage không hợp lệ', parsed.error.flatten())
  }
  await confirmStage(id.id, parsed.data.stage)
  return apiOk({ ok: true })
}

// DELETE /api/v1/knowledge-sources/[id] — xoá nguồn + chunks + tags (quiz giữ nguyên nếu có).
export async function DELETE(_req: Request, params: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = await parsePathId(params.params)
  if (id.error) return id.error
  await libraryStore.deleteSource(id.id)
  return apiOk({ ok: true })
}
