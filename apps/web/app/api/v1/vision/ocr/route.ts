import { NextResponse } from 'next/server'
import { parseBody } from '@/lib/api-utils'
import { ocrInputSchema, readImageText } from '@/lib/ai/ocr'

// POST /api/v1/vision/ocr — ảnh giấy tờ y tế (data URL) → AI đọc TOÀN BỘ chữ.
// Body: { imageDataUrl: "data:image/..." }. Trả { ok: true, text } — text string
// tiếng Việt, hoặc text: null khi không đọc được (thiếu key / mạng lỗi / AI trả
// rỗng) — KHÔNG 500. Chạy server-side: key OpenRouter không xuống client.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(ocrInputSchema, body)
  if (!parsed.ok) return parsed.error
  const text = await readImageText(parsed.data.imageDataUrl)
  return NextResponse.json({ ok: true, text })
}
