import { apiOk, apiError, parseBody } from '@/lib/api-utils'
import { questionReportInputSchema, questionReportStore } from '@/lib/question-reports'

// POST /api/v1/quizzes/report — gửi báo lỗi một câu hỏi quiz.
// Body: { quiz_question_id, reason, details? } → lưu bảng question_reports.
export async function POST(req: Request): Promise<Response> {
  const parsed = parseBody(questionReportInputSchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error

  try {
    const report = await questionReportStore.create(parsed.data)
    return apiOk(report, 201)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lưu báo lỗi thất bại'
    return apiError('REPORT_FAILED', message, undefined, 400)
  }
}
