import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError, parsePathId } from '@/lib/api-utils'
import { generateQuizSet } from '@/lib/library/pipeline'
import { knowledgeStageSchema } from '@mevabe/domain'

const quizGenSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  stage: knowledgeStageSchema.optional(),
})

// POST /api/v1/knowledge-sources/[id]/quiz — sinh bộ quiz TỪ nguồn đã import.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error

  const source = (await data.getKnowledgeSources()).find((s) => s.id === id.id)
  if (!source) return apiError('NOT_FOUND', 'Không tìm thấy nguồn', undefined, 404)

  const parsed = quizGenSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Dữ liệu gửi lên không hợp lệ', parsed.error.flatten())
  }

  try {
    const result = await generateQuizSet({
      sourceIds: [id.id],
      stage: parsed.data.stage ?? source.stage,
      title: parsed.data.title ?? `${source.title} — Quiz`,
    })
    return apiOk(result, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi sinh quiz'
    return apiError('QUIZ_FAILED', message, undefined, 422)
  }
}
