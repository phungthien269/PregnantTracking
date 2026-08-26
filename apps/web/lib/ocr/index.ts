// ===========================================================================
// lib/ocr — OCR chỉ số khám → xác nhận → ghi biểu đồ.
// Flow: route extract (ảnh/text → items KHÔNG lưu) → UI xác nhận →
//       route confirm → saveExtracted() ghi qua data layer (DataApi.addMeasurement).
// AI seam (seam.ts) chạy trước; null/không có key → fallback regex (parse.ts).
// ===========================================================================

import type { MeasurementType, MaternalMeasurement } from '@mevabe/domain'
import { data } from '@/lib/data'
import { parseMeasurements } from './parse'
import type { OcrExtraction } from './parse'
import { aiExtractMeasurements } from './seam'

export { parseMeasurements, fold, toNumber, ocrExtractionSchema, OCR_LABELS, OCR_UNITS } from './parse'
export type { OcrExtraction, OcrMeasurementType } from './parse'
export { aiExtractMeasurements, parseAiExtractions } from './seam'

export interface OcrExtractResult {
  /** Chỉ số trích xuất được — UI cần xác nhận trước khi lưu. */
  items: OcrExtraction[]
  ai: boolean
  message?: string
}

/** Bước "extract": trích, KHÔNG lưu gì vào measurements. */
export async function extractOcr(input: {
  image?: string
  text?: string
}): Promise<OcrExtractResult> {
  const text = (input.text ?? '').trim()

  if (input.image) {
    const ai = await aiExtractMeasurements({ image: input.image, text }).catch(() => null)
    if (ai && ai.length > 0) return { items: ai, ai: true }
    if (!text) {
      return {
        items: [],
        ai: false,
        message:
          'Không trích được chỉ số từ ảnh. Hãy thử ảnh rõ hơn, hoặc dán nội dung tờ khám (chữ không dấu cũng được).',
      }
    }
  }

  if (text) {
    const ai = await aiExtractMeasurements({ text }).catch(() => null)
    if (ai && ai.length > 0) return { items: ai, ai: true }
    return { items: parseMeasurements(text), ai: false }
  }

  return { items: [], ai: false, message: 'Cần gửi ảnh hoặc text tờ khám.' }
}

/** Một mục người dùng đã xác nhận trên UI, sẵn sàng lưu. */
export interface ConfirmedOcrItem {
  type: MeasurementType
  value: number
  unit: string
  diastolic?: number | null
  note?: string
}

/**
 * Bước "confirm": lưu các mục đã xác nhận vào measurements qua data layer.
 * MeasurementInput đã có `diastolic?` (khế ước) → truyền thẳng cột diastolic,
 * KHÔNG ghép vào note nữa.
 */
export async function saveExtracted(
  items: ConfirmedOcrItem[],
  takenAt: string,
): Promise<MaternalMeasurement[]> {
  const saved: MaternalMeasurement[] = []
  for (const it of items) {
    saved.push(
      await data.addMeasurement({
        type: it.type,
        value: it.value,
        unit: it.unit,
        diastolic: it.diastolic ?? undefined,
        taken_at: takenAt,
        note: it.note?.trim() || undefined,
      }),
    )
  }
  return saved
}
