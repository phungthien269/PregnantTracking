import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'

// GET /api/v1/medical-visits — danh sách hồ sơ khám của user (visit_date desc).
export async function GET(): Promise<Response> {
  return apiOk(await data.getMedicalVisits())
}

const medicalVisitSchema = z.object({
  visit_date: z.string().date(), // YYYY-MM-DD
  clinic: z.string().max(200).nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
  child_id: z.string().uuid().nullable().optional(),
  pregnancy_id: z.string().uuid().nullable().optional(),
})

// POST /api/v1/medical-visits — thêm 1 lần khám (per-user: private_owner_id = người tạo).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(medicalVisitSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addMedicalVisit(parsed.data), 201)
}
