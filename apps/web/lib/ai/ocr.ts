// ===========================================================================
// OCR giấy tờ y tế từ ảnh (server-only). Nhận data URL ảnh (đơn thuốc, kết quả
// xét nghiệm, phiếu khám) → AI vision đọc TOÀN BỘ chữ → trả text tiếng Việt sạch.
// Không có key / mạng lỗi / AI trả rỗng → trả null (UI hiện "không đọc được"),
// KHÔNG throw — route không bao giờ 500 vì lỗi AI.
// ===========================================================================

import { z } from 'zod'
import { visionCompletion, aiConfigured } from './client'

const MAX_OCR_BYTES = 10 * 1024 * 1024
// Base64 ≈ 4/3 × bytes; data:image/...;base64, (chừa đủ cho ảnh 10MB).
const MAX_DATA_URL_LEN = Math.ceil((MAX_OCR_BYTES * 4) / 3) + 64

/** Input route POST /api/v1/vision/ocr — data URL ảnh hợp lệ (như meals-photo). */
export const ocrInputSchema = z.object({
  imageDataUrl: z.string().startsWith('data:image/').max(MAX_DATA_URL_LEN),
})
export type OcrInput = z.infer<typeof ocrInputSchema>

const OCR_SYSTEM = `Bạn là trợ lý "Mẹ & Bé" — ứng dụng theo dõi thai kỳ cho gia đình Việt.
Người dùng chụp giấy tờ y tế (đơn thuốc, kết quả xét nghiệm, phiếu khám).
Hãy đọc chính xác toàn bộ chữ/văn bản trong ảnh.
Xuất ra dạng văn bản sạch, giữ nguyên tên thuốc, liều dùng, chỉ số, con số, đơn vị.
Không thêm lời giải thích, không tóm tắt, không bịa chữ, không hỏi lại.
Nếu không đọc được chữ nào trong ảnh, trả đúng chuỗi rỗng.`

/** Đọc toàn bộ chữ từ ảnh giấy tờ y tế. Trả text tiếng Việt sạch, hoặc null khi
 * không đọc được (thiếu key / mạng lỗi / AI trả rỗng). KHÔNG throw. */
export async function readImageText(imageDataUrl: string): Promise<string | null> {
  if (!aiConfigured()) return null
  try {
    const reply = await visionCompletion({
      messages: [
        { role: 'system', text: OCR_SYSTEM },
        { role: 'user', text: 'Hãy đọc toàn bộ chữ trong ảnh giấy tờ y tế này.', imageDataUrl },
      ],
      temperature: 0.1,
      maxTokens: 2048,
    })
    const text = reply.content.trim()
    return text.length > 0 ? text : null
  } catch {
    return null
  }
}
