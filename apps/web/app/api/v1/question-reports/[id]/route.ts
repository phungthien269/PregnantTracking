import { z } from 'zod'
import { apiOk, apiError, parseBody, parsePathId } from '@/lib/api-utils'
import { questionReportStore } from '@/lib/question-reports'

const bodySchema = z.object({
  status: z.enum(['resolved', 'rejected']),
})

// PATCH /api/v1/question-reports/[id] — đánh dấu đã xử lý (resolved/rejected).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error

  const parsed = parseBody(bodySchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error

  try {
    const report = await questionReportStore.updateStatus(id.id, parsed.data.status)
    return apiOk(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không tìm thấy báo cáo'
    return apiError('REPORT_NOT_FOUND', message, undefined, 404)
  }
}
