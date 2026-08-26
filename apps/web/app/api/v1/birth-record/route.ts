import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'
import { birthTypeSchema, dateSchema, idSchema } from '@mevabe/domain'

const birthRecordInputSchema = z.object({
  pregnancy_id: idSchema.optional(),
  birth_date: dateSchema,
  birth_type: birthTypeSchema,
  hospital: z.string().max(200).optional(),
  duration_hours: z.number().positive().optional(),
  complications: z.array(z.string().max(100)).optional(),
  notes: z.string().max(2000).optional(),
})

// POST /api/v1/birth-record — ghi bản ghi sinh (dữ liệu gia đình, persist SQLite).
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(birthRecordInputSchema, body)
  if (!parsed.ok) return parsed.error
  return apiOk(await data.addBirthRecord(parsed.data), 201)
}
