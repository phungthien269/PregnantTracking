import { z } from 'zod'
import { SYMPTOM_SEVERITIES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, apiError, parseBody } from '@/lib/api-utils'

const itemSchema = z.object({
  symptom: z.string().min(1).max(100),
  severity: z.enum(SYMPTOM_SEVERITIES),
  started_at: z.string().datetime({ offset: true }),
  note: z.string().max(2000).optional(),
  /** "Chỉ mình tôi" — mock lọc private_owner_id theo active user. */
  private: z.boolean().optional(),
})

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(100),
})

// POST /api/v1/import/symptoms — import HÀNG LOẠT triệu chứng (max 100, source 'manual').
// Dữ liệu nằm cùng store addSymptom → getSymptoms()/getDashboard().recentSymptoms
// (AI symptom analyzer + chat context buildChatContext) tự thấy.
export async function POST(req: Request): Promise<Response> {
  const parsed = parseBody(bodySchema, await req.json().catch(() => null))
  if (!parsed.ok) return parsed.error
  try {
    const result = await data.importSymptoms(parsed.data.items)
    return apiOk(result, 201)
  } catch (err) {
    return apiError('IMPORT_FAILED', (err as Error).message, undefined, 400)
  }
}
