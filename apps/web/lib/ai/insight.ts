// ===========================================================================
// Insight hằng ngày (tiếng Việt) — AI nếu có key, ngược lại fallback template.
// Cảnh báo KHẨN không nằm ở đây — chỉ do rule engine (alert-rules.ts).
// ===========================================================================

import type { MaternalMeasurement, SymptomReport, Trimester } from '@mevabe/domain'
import { chatCompletion } from './client'
import { insightSystemPrompt } from './prompts'

export interface InsightInput {
  week: number
  trimester?: Trimester
  measurements?: MaternalMeasurement[]
  symptoms?: SymptomReport[]
  mealCountToday?: number
}

export function buildInsightContext(input: InsightInput): string {
  const lines = [`Tuần thai: ${input.week}.`]
  if (input.trimester) lines.push(`Giai đoạn: ${input.trimester}.`)
  if (input.mealCountToday) lines.push(`Mẹ đã ghi ${input.mealCountToday} bữa ăn hôm nay.`)
  const latestW = [...(input.measurements ?? [])].reverse().find((m) => m.type === 'weight')
  if (latestW) lines.push(`Cân nặng gần nhất: ${latestW.value} kg (${latestW.taken_at.slice(0, 10)}).`)
  const syms = input.symptoms ?? []
  if (syms.length > 0) lines.push(`Triệu chứng gần đây: ${syms.slice(0, 3).map((s) => s.symptom).join(', ')}.`)
  return lines.join('\n')
}

/** Fallback không AI — insight template theo tam cá nguyệt. */
export function templateInsight(input: InsightInput): string {
  const week = input.week
  if (week <= 13) {
    return 'Mẹ đang ở tam cá nguyệt đầu — bé đang hình thành các cơ quan quan trọng. Chú ý bổ sung axit folic, sắt và uống đủ nước nhé.'
  }
  if (week <= 27) {
    return 'Tam cá nguyệt thứ hai — mẹ thường dễ chịu hơn. Duy trì dinh dưỡng đủ canxi, sắt và theo dõi thai máy đều đặn.'
  }
  return 'Những tuần cuối — bé tăng cân nhanh, mẹ có thể thấy mệt và khó ngủ. Nghỉ ngơi đủ, chuẩn bị đồ đi sinh và để ý dấu hiệu chuyển dạ.'
}

export async function generateInsight(
  input: InsightInput,
): Promise<{ insight: string; ai: boolean; model?: string; provider?: string }> {
  const fallback = templateInsight(input)
  try {
    const reply = await chatCompletion({
      messages: [
        { role: 'system', content: insightSystemPrompt() },
        { role: 'user', content: `${buildInsightContext(input)}\n\nHãy viết insight hôm nay.` },
      ],
      temperature: 0.7,
      maxTokens: 400,
    })
    return { insight: reply.content, ai: true, model: reply.model, provider: reply.provider }
  } catch {
    return { insight: fallback, ai: false }
  }
}
