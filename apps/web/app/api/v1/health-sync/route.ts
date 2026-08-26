import { data } from '@/lib/data'
import { apiOk, parseBody } from '@/lib/api-utils'
import { healthSyncEnvelopeSchema, summarizeSamples, type HealthSyncDataApi } from '@/lib/health-sync'

// POST /api/v1/health-sync — đồng bộ HealthKit (iOS).
// Payload: { source:"healthkit", samples:[{ id, type, value, unit, source?,
// startedAt, endedAt?, auxiliary? }] } (ISO8601). Dedupe theo source=healthkit +
// type + taken_at → không ghi đè dữ liệu nhập tay (manual). Loại chưa có chỗ lưu
// (activity, sleep) → báo `skipped`.
export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = parseBody(healthSyncEnvelopeSchema, body)
  if (!parsed.ok) return parsed.error

  const { accepted, skipped, measurements } = summarizeSamples(parsed.data.samples)
  const { created, duplicates } = await (data as unknown as HealthSyncDataApi).upsertHealthMetric(measurements)

  return apiOk({
    accepted,
    duplicates,
    saved: created.length,
    skipped,
  })
}
