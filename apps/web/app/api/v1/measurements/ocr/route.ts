import { z } from 'zod'
import { MEASUREMENT_TYPES } from '@mevabe/domain'
import { apiOk, parseBody } from '@/lib/api-utils'
import { extractOcr, saveExtracted } from '@/lib/ocr'

// ---------------------------------------------------------------------------
// POST /api/v1/measurements/ocr — trích chỉ số từ ảnh/text tờ khám (KHÔNG lưu).
//   body: { action: 'extract', image?: dataURL, text?: string } → { data: { items, ai, message? } }
//   body: { action: 'confirm', taken_at, items } → { data: { saved } } (201)
// Flow 2 bước: extract trả items để UI xác nhận → confirm mới lưu vào measurements.
// ---------------------------------------------------------------------------

const imageDataUrlSchema = z
  .string()
  .max(6_000_000)
  .refine((v) => /^data:image\/[a-z0-9.+-]+;base64,/.test(v), {
    message: 'image phải là data URL ảnh base64 (data:image/...)',
  })

const extractSchema = z
  .object({
    action: z.literal('extract').optional().default('extract'),
    image: imageDataUrlSchema.optional(),
    text: z.string().max(10_000).optional(),
  })
  .refine((d) => d.image || d.text, { message: 'Cần gửi ít nhất image hoặc text' })

const confirmItemSchema = z.object({
  type: z.enum(MEASUREMENT_TYPES),
  value: z.number().finite(),
  unit: z.string().min(1).max(20),
  diastolic: z.number().finite().optional(),
  note: z.string().max(1000).optional(),
})

const confirmSchema = z.object({
  action: z.literal('confirm'),
  taken_at: z.string().datetime({ offset: true }),
  items: z.array(confirmItemSchema).min(1).max(20),
})

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)

  if (body?.action === 'confirm') {
    const parsed = parseBody(confirmSchema, body)
    if (!parsed.ok) return parsed.error
    const saved = await saveExtracted(parsed.data.items, parsed.data.taken_at)
    return apiOk({ saved }, 201)
  }

  const parsed = parseBody(extractSchema, body)
  if (!parsed.ok) return parsed.error
  const { image, text } = parsed.data
  const result = await extractOcr({ image, text })
  return apiOk(result)
}
