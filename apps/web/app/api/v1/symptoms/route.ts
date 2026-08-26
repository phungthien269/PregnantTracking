import { z } from 'zod'
import { SYMPTOM_SEVERITIES } from '@mevabe/domain'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

const symptomInputSchema = z.object({
  symptom: z.string().min(1).max(100),
  severity: z.enum(SYMPTOM_SEVERITIES),
  started_at: z.string().datetime({ offset: true }),
  note: z.string().max(2000).optional(),
  /** "Chỉ mình tôi" — mock lọc private_owner_id theo active user. */
  private: z.boolean().optional(),
})

// GET /api/v1/symptoms — nhật ký triệu chứng.
export async function GET(): Promise<Response> {
  return apiOk(await data.getSymptoms())
}

// POST /api/v1/symptoms — ghi triệu chứng mới.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(symptomInputSchema, body)
  if (!parsed.ok) return parsed.error
  const symptom = await data.addSymptom(parsed.data)
  return apiOk(symptom, 201)
}
