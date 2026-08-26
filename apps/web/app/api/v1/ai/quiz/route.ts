import { z } from 'zod'
import { apiOk, apiError, parseBody } from '@/lib/api-utils'
import { chatCompletion, aiConfigured } from '@/lib/ai/client'
import { buildQuizMessages, parseQuizResponse } from '@/lib/ai/quiz-gen'

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  /** Các chunk nội dung đã lập index (dạng text thường). */
  chunks: z.array(z.string().min(1)).min(1).max(20),
  count: z.number().int().min(1).max(10).optional(),
})

// POST /api/v1/ai/quiz — sinh câu hỏi trắc nghiệm từ nội dung import.
// Agent 6 nối UI; chưa có key → 503 rõ ràng.
export async function POST(req: Request): Promise<Response> {
  const parsed = parseBody(bodySchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error

  if (!aiConfigured()) {
    return apiError('AI_NOT_CONFIGURED', 'Chưa cấu hình OPENROUTER_API_KEY — không sinh quiz được', undefined, 503)
  }

  try {
    const reply = await chatCompletion({
      messages: buildQuizMessages(parsed.data),
      json: true,
      temperature: 0.4,
      // Ling-flash là reasoning model (ngốn token cho suy luận) + tối đa 10 câu JSON.
      maxTokens: 3000,
    })
    const questions = parseQuizResponse(reply.content)
    return apiOk({ questions, model: reply.model, provider: reply.provider })
  } catch (err) {
    return apiError('AI_GENERATION_FAILED', (err as Error).message, undefined, 502)
  }
}
