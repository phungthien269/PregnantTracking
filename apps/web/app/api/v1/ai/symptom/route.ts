import { z } from 'zod'
import { apiOk, parseBody } from '@/lib/api-utils'
import { chatCompletion, aiConfigured } from '@/lib/ai/client'
import { symptomUserPrompt } from '@/lib/ai/prompts'
import { triageSymptom, dangerActions, parseSymptomJson } from '@/lib/ai/symptom-triage'
import { symptomFallback } from '@/lib/ai/sources'

const bodySchema = z.object({
  symptom: z.string().min(1).max(1000),
  /** Nhãn dấu hiệu nguy hiểm người dùng đã đánh dấu (từ DANGER_SIGNS). */
  danger_signs: z.array(z.string()).default([]),
  week: z.number().int().min(1).max(42).optional(),
})

// POST /api/v1/ai/symptom — phân tích triệu chứng.
// BƯỚC 1: triage cứng TRƯỚC — khẩn thì không gọi AI, chỉ hành động + nguồn.
// BƯỚC 2: không khẩn → AI (nếu có key) cho khả năng liên quan + hành động; lỗi → fallback.
export async function POST(req: Request): Promise<Response> {
  const parsed = parseBody(bodySchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  const { symptom, danger_signs, week } = parsed.data

  const triage = triageSymptom(symptom, danger_signs)

  if (triage.urgent) {
    const d = dangerActions()
    return apiOk({
      urgent: true,
      urgency: 'danger',
      matched: triage.matched,
      reason: triage.reason,
      actions: d.actions,
      sources: d.sources.map((s) => ({ title: s, source: s, type: 'article' })),
      ai: false,
    })
  }

  if (aiConfigured()) {
    try {
      const reply = await chatCompletion({
        messages: [
          { role: 'system', content: 'Bạn là trợ lý chăm sóc thai kỳ Mẹ & Bé. Chỉ trả lời JSON đúng định dạng yêu cầu. Không bịa nguồn. Không nhắc định danh.' },
          { role: 'user', content: symptomUserPrompt(symptom, week) },
        ],
        json: true,
        temperature: 0.4,
        maxTokens: 400,
      })
      const ai = parseSymptomJson(reply.content)
      return apiOk({
        urgent: false,
        urgency: triage.urgency,
        matched: [],
        reason: triage.reason,
        possible_causes: ai.possible_causes,
        actions: ai.actions,
        sources: ai.sources.map((s) => ({ title: s, source: s, type: 'article' })),
        ai: true,
        model: reply.model,
        provider: reply.provider,
      })
    } catch {
      // AI lỗi → rơi xuống fallback nguồn.
    }
  }

  const fb = symptomFallback(symptom)
  return apiOk({
    urgent: false,
    urgency: triage.urgency,
    matched: [],
    reason: triage.reason,
    possible_causes: fb.possibleCauses,
    actions: fb.actions,
    sources: fb.sources.map((s) => ({ title: s, source: s, type: 'article' })),
    ai: false,
  })
}
