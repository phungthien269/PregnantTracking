// ===========================================================================
// intake-analysis.ts — Phân tích & chẩn đoán dinh dưỡng theo kỳ (Agent 6K).
// - Nhận `NutrientSummary` (từ getNutrientSummary) → `analyzeDeficiencies`
//   (intake-calcs) → danh sách chất thiếu dai dẳng + món gợi ý có nguồn.
// - Gọi AI (chatCompletion, model free) viết 1 đoạn ngắn tiếng Việt. CHỈ gửi
//   dữ liệu TỔNG HỢP theo kỳ (không tên, không định danh, không thông tin cá
//   nhân nhạy cảm). Lỗi AI / thiếu key → `ai: null`, KHÔNG crash (UI vẫn hiện
//   danh sách thiếu chất ở bước 1).
// Thuần logic + chạy server-side — check bằng node (intake-analysis.check.ts).
// ===========================================================================

import { chatCompletion, aiConfigured } from './client'
import { analyzeDeficiencies, type DeficiencySuggestion } from '../nutrition/intake-calcs'
import type { NutrientSummary } from '../data/api'

/** Lời phân tích AI (null = AI không chạy được — thiếu key/lỗi mạng/lỗi phản hồi). */
export interface AiNarrative {
  text: string
  model?: string
  provider?: string
}

/** Kết quả chẩn đoán theo kỳ — UI render trực tiếp. */
export interface IntakeDiagnosis {
  from: string
  to: string
  week: number | null
  /** số ngày có nhật ký trong kỳ — 0 = chưa có dữ liệu (UI hiện nhắc ghi nhật ký). */
  dayCount: number
  deficiencies: DeficiencySuggestion[]
  ai: AiNarrative | null
}

const DAY_MS = 86_400_000

/** Nhãn kỳ tự động từ khoảng from→to (fallback khi caller không truyền `periodLabel`). */
export function buildPeriodLabel(summary: Pick<NutrientSummary, 'from' | 'to'>): string {
  const span = Math.round((+new Date(summary.to) - +new Date(summary.from)) / DAY_MS) + 1
  if (span <= 7) return '7 ngày gần đây'
  if (span <= 31) return '30 ngày gần đây'
  return '3 tháng gần đây'
}

const SYSTEM_PROMPT = `Bạn là chuyên gia dinh dưỡng thai kỳ của ứng dụng Mẹ & Bé.
Chỉ dùng dữ liệu TỔNG HỢP được cung cấp; KHÔNG bịa số liệu, không nhắc tên/định danh người dùng.
Viết tiếng Việt tự nhiên, ngắn gọn (2–4 câu), giọng nhẹ nhàng, dễ hiểu.
Đây là thông tin tham khảo, không thay thế lời khuyên bác sĩ.`

/** Biên soạn prompt gửi AI — chỉ chứa dữ liệu tổng hợp theo kỳ (không PII). */
export function buildAiPrompt(
  summary: NutrientSummary,
  deficiencies: DeficiencySuggestion[],
  periodLabel: string,
): string {
  const lines: string[] = []
  lines.push(`Kỳ phân tích: ${periodLabel} (từ ${summary.from} đến ${summary.to}).`)
  if (summary.week) lines.push(`Tuần thai hiện tại: ${summary.week}.`)
  lines.push('')
  if (deficiencies.length === 0) {
    lines.push('Các vi chất theo dõi đều đạt từ 80% nhu cầu trở lên — không có chất thiếu dai dẳng.')
  } else {
    lines.push('Danh sách vi chất thiếu dai dẳng (trung bình ngày đạt dưới 80% nhu cầu, kèm món gợi ý):')
    for (const d of deficiencies) {
      // pct = trung bình ngày / nhu cầu ngày → diễn đạt "trung bình mỗi ngày" cho khớp.
      const avg = d.totalDays > 0 ? Math.round((d.total / d.totalDays) * 10) / 10 : 0
      lines.push(
        `- ${d.name}: trung bình nạp ~${avg} ${d.unit}/ngày (nhu cầu ${d.need ?? 0} ${d.unit}/ngày), đạt ~${d.pct ?? 0}% nhu cầu, thiếu ${d.lowDays}/${d.totalDays} ngày. Món giàu chất này: ${d.foodSuggestions.join(', ') || 'không có dữ liệu'}.`,
      )
    }
  }
  lines.push('')
  lines.push(
    'Hãy viết 1 đoạn ngắn tiếng Việt tóm tắt cho mẹ: chất nào đang thiếu dai dẳng, mức độ (kèm % nhu cầu), và gợi ý bổ sung bằng món ăn/thực phẩm chức năng. Nếu không thiếu chất nào, khen mẹ duy trì tốt và nhắc tiếp tục. Không bịa số liệu.',
  )
  return lines.join('\n')
}

/** Gọi AI viết lời phân tích. Trả null khi thiếu key / lỗi mạng / phản hồi lỗi — KHÔNG throw. */
export async function generateAiNarrative(
  summary: NutrientSummary,
  deficiencies: DeficiencySuggestion[],
  periodLabel: string,
): Promise<AiNarrative | null> {
  if (!aiConfigured()) return null
  // Không có nhật ký trong kỳ → không có gì để phân tích (tránh AI bịa "đều tốt").
  if (summary.days.length === 0) return null
  try {
    const reply = await chatCompletion({
      // Dùng model KHÔNG-suy-luận (Gemma 4 free) cho lời phân tích — model mặc
      // định (ling-flash reasoning) thi thoảng dùng hết max_tokens cho phần suy
      // luận → content rỗng. Gemma trả nội dung ổn định, free.
      model: 'google/gemma-4-26b-a4b-it:free',
      temperature: 0.6,
      maxTokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildAiPrompt(summary, deficiencies, periodLabel) },
      ],
    })
    return { text: reply.content, model: reply.model, provider: reply.provider }
  } catch {
    return null
  }
}

/**
 * Chẩn đoán đầy đủ theo kỳ: nhận diện thiếu chất (bước 1, thuần TS) + AI viết
 * lời (bước 2, có fallback — `ai: null` khi không gọi được AI). Chạy server-side.
 */
export async function analyzeIntake(
  summary: NutrientSummary,
  opts?: { thresholdPct?: number; periodLabel?: string },
): Promise<IntakeDiagnosis> {
  const deficiencies = analyzeDeficiencies(summary, opts?.thresholdPct ?? 80)
  const label = opts?.periodLabel?.trim() || buildPeriodLabel(summary)
  const ai = await generateAiNarrative(summary, deficiencies, label)
  return { from: summary.from, to: summary.to, week: summary.week, dayCount: summary.days.length, deficiencies, ai }
}
