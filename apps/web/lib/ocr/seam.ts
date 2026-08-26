// ===========================================================================
// seam.ts — AI seam cho OCR chỉ số khám. Giống hệt pattern các feature AI khác:
//   aiConfigured() ? (gọi OpenRouter → parse JSON; lỗi → null) : null
// Caller (index.ts) rơi xuống fallback heuristic khi seam trả null.
// - text: dùng chatCompletion (client.ts).
// - image: dùng visionCompletion (client.ts) — gateway multimodal chuẩn OpenAI.
// ===========================================================================

import { z } from 'zod'
import { chatCompletion, visionCompletion, aiConfigured } from '@/lib/ai/client'
import { extractJson } from '@/lib/ai/symptom-triage'
import { OCR_LABELS, OCR_UNITS, ocrMeasurementTypeSchema } from './parse'
import type { OcrExtraction } from './parse'

const SYSTEM_PROMPT = `Bạn là trợ lý trích xuất chỉ số khám thai của ứng dụng "Mẹ & Bé" tại Việt Nam.
Chỉ trích các chỉ số: cân nặng (weight, kg), huyết áp (blood_pressure, mmHg — tâm thu vào value, tâm trương vào diastolic), đường huyết (blood_glucose, mmol/L), vòng eo (waist_circumference, cm), BMI (bmi), chiều cao tử cung (fundal_height, cm), nhịp tim (heart_rate, lần/phút).
Chỉ trả JSON thuần, đúng định dạng: {"items":[{"type":"weight","value":62.5,"unit":"kg","diastolic":null}]}.
Chỉ lấy số có trong tờ khám, không bịa. Không nhắc thông tin định danh bệnh nhân.`

const USER_TEXT_PROMPT =
  'Hãy trích các chỉ số trong nội dung tờ khám sau (chữ có dấu hoặc không dấu). Không có chỉ số nào thì trả {"items":[]}.\n\n'

const USER_IMAGE_PROMPT =
  'Hãy đọc các chỉ số trong ảnh tờ khám và trích theo định dạng JSON. Không đọc được thì trả {"items":[]}.'

const aiItemSchema = z
  .object({
    type: ocrMeasurementTypeSchema,
    value: z.number(),
    unit: z.string().max(20),
    diastolic: z.number().nullable().optional(),
  })
  .strict()

const aiOutputSchema = z.object({ items: z.array(aiItemSchema).max(20) }).strict()

/** Phân tích phản hồi JSON của model → danh sách OcrExtraction (gắn nhãn + đơn vị). */
export function parseAiExtractions(content: string): OcrExtraction[] | null {
  try {
    const parsed = aiOutputSchema.safeParse(JSON.parse(extractJson(content)))
    if (!parsed.success) return null
    return parsed.data.items.map((it) => ({
      type: it.type,
      label: OCR_LABELS[it.type],
      value: it.value,
      unit: it.unit || OCR_UNITS[it.type],
      diastolic: it.diastolic ?? undefined,
    }))
  } catch {
    return null
  }
}

async function visionExtract(imageDataUrl: string): Promise<string | null> {
  try {
    const reply = await visionCompletion({
      messages: [
        { role: 'system', text: SYSTEM_PROMPT },
        { role: 'user', text: USER_IMAGE_PROMPT, imageDataUrl },
      ],
      json: true,
      temperature: 0.2,
      maxTokens: 600,
    })
    return reply.content
  } catch {
    return null
  }
}

/**
 * Seam AI: trích chỉ số từ text hoặc ảnh tờ khám.
 * Trả null khi chưa cấu hình AI hoặc mọi lỗi — caller dùng fallback heuristic.
 */
export async function aiExtractMeasurements(input: {
  image?: string
  text?: string
}): Promise<OcrExtraction[] | null> {
  if (!aiConfigured()) return null
  try {
    if (input.image) {
      const content = await visionExtract(input.image)
      return content ? parseAiExtractions(content) : null
    }
    const reply = await chatCompletion({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_TEXT_PROMPT + (input.text ?? '') },
      ],
      json: true,
      temperature: 0.2,
      maxTokens: 600,
    })
    return parseAiExtractions(reply.content)
  } catch {
    return null
  }
}
