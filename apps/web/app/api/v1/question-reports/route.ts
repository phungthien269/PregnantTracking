import { apiOk } from '@/lib/api-utils'
import { questionReportStore } from '@/lib/question-reports'

// GET /api/v1/question-reports — moderation: danh sách report + đếm theo câu hỏi.
// byQuestion: gộp theo quiz_question_id, ưu tiên câu còn nhiều report chưa xử lý.
export async function GET(): Promise<Response> {
  const [reports, byQuestion] = await Promise.all([
    questionReportStore.list(),
    questionReportStore.summary(),
  ])
  return apiOk({ reports, byQuestion })
}
