import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody, parsePathId } from '@/lib/api-utils'

// GET /api/v1/medical-visits/[id]/documents — ảnh giấy khám/đơn thuốc/kết quả của 1 lần khám.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  return apiOk(await data.getVisitDocuments(id.id))
}

const visitDocumentSchema = z.object({
  filename: z.string().min(1).max(255),
  mime: z.string().min(1).max(100),
  // Data URL base64 (VD "data:image/jpeg;base64,..."). Giới hạn kích thước phía client (UI nén ảnh trước khi gửi).
  imageDataUrl: z.string().min(1),
  ocrText: z.string().max(20000).nullable().optional(),
})

// POST /api/v1/medical-visits/[id]/documents — đính 1 ảnh tài liệu (kèm nội dung AI đọc được).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const id = await parsePathId(params)
  if (id.error) return id.error
  const body = await req.json().catch(() => null)
  const parsed = parseBody(visitDocumentSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addVisitDocument(id.id, parsed.data), 201)
}
