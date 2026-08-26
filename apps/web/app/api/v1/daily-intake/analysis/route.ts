import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'
import { analyzeIntake } from '@/lib/ai/intake-analysis'

// ===========================================================================
// /api/v1/daily-intake/analysis — Phân tích & chẩn đoán dinh dưỡng theo kỳ
// (Agent 6K). GET ?from=&to=[&label=]
//   - Lấy tổng vi chất theo kỳ (getNutrientSummary) → analyzeDeficiencies
//     (chất thiếu dai dẳng + món gợi ý có nguồn).
//   - AI viết lời phân tích ngắn tiếng Việt (chỉ dữ liệu TỔNG HỢP theo kỳ —
//     không tên/PII). Lỗi AI/key → `ai: null`, KHÔNG crash.
// ===========================================================================

const periodSchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
  label: z.string().max(40).optional(),
})

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const parsed = periodSchema.safeParse({
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    label: url.searchParams.get('label')?.trim() || undefined,
  })
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'from/to phải dạng YYYY-MM-DD', parsed.error.flatten())
  }
  if (parsed.data.from > parsed.data.to) {
    return apiError('VALIDATION_ERROR', 'from phải nhỏ hơn hoặc bằng to')
  }
  const summary = await data.getNutrientSummary({ from: parsed.data.from, to: parsed.data.to })
  const diagnosis = await analyzeIntake(summary, { periodLabel: parsed.data.label })
  return apiOk(diagnosis)
}
