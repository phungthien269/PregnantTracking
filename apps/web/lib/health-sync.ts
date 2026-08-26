// ===========================================================================
// HealthKit sync (iOS) — parse + normalize + dedupe payload `/api/v1/health-sync`.
// Payload iOS gửi (xem apps/ios/MeVaBe/Services/HealthKitService.swift +
// Core/Models/Entities.swift): { source:"healthkit", samples:[{ id, type,
// value, unit, source, startedAt, endedAt?, auxiliary? }] }, ISO8601.
// Map sang `maternal_measurements`: weight/blood_pressure/heart_rate/activity/
// sleep. activity → 'steps'; sleep → số giờ tính từ khoảng startedAt–endedAt.
// ===========================================================================

import { z } from 'zod'
import type * as D from '@mevabe/domain'

/** Loại mẫu HealthKit từ iOS (HealthDataType.rawValue). */
export const HEALTHKIT_SAMPLE_TYPES = ['weight', 'blood_pressure', 'activity', 'sleep', 'heart_rate'] as const
export const healthKitSampleSchema = z.object({
  id: z.string().min(1),
  type: z.enum(HEALTHKIT_SAMPLE_TYPES),
  value: z.number().finite(),
  unit: z.string().min(1).max(20),
  source: z.literal('healthkit').optional(),
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).optional(),
  auxiliary: z.number().finite().optional(),
})
export type HealthKitSample = z.infer<typeof healthKitSampleSchema>

export const healthSyncEnvelopeSchema = z.object({
  source: z.literal('healthkit'),
  samples: z.array(healthKitSampleSchema).max(1000),
})
export type HealthSyncEnvelope = z.infer<typeof healthSyncEnvelopeSchema>

/** Một dòng sẵn sàng lưu vào maternal_measurements (source cố định 'healthkit'). */
export interface HealthMetricInput {
  type: D.MeasurementType
  value: number
  unit: string
  diastolic?: number | null
  taken_at: string
}

export interface HealthSyncSummary {
  /** Số mẫu map được sang measurement_type (weight/blood_pressure/heart_rate/activity/sleep). */
  accepted: number
  /** Số mẫu đã tồn tại (source=healthkit + type + taken_at) → bỏ qua, không ghi đè. */
  duplicates: number
  /** Mẫu không map được sang measurement_type (type lạ/thiếu dữ liệu). */
  skipped: Array<{ type: string; count: number }>
  /** Các dòng dedupe xong, sẵn sàng persist. */
  measurements: HealthMetricInput[]
}

/** Map một mẫu HealthKit sang dòng maternal_measurements; null nếu chưa có loại lưu. */
export function toHealthMetric(sample: HealthKitSample): HealthMetricInput | null {
  switch (sample.type) {
    case 'weight':
      return { type: 'weight', value: sample.value, unit: 'kg', taken_at: sample.startedAt }
    case 'blood_pressure':
      return {
        type: 'blood_pressure',
        value: sample.value, // tâm thu
        unit: 'mmHg',
        diastolic: sample.auxiliary ?? null,
        taken_at: sample.startedAt,
      }
    case 'heart_rate':
      return { type: 'heart_rate', value: sample.value, unit: 'lần/phút', taken_at: sample.startedAt }
    case 'activity':
      // stepCount (HealthKit) → đơn vị chuẩn 'steps'; payload iOS gửi unit 'bước'.
      return { type: 'activity', value: sample.value, unit: 'steps', taken_at: sample.startedAt }
    case 'sleep': {
      // sleepAnalysis: payload iOS gửi value = category raw + unit 'category';
      // lưu số giờ ngủ tính từ khoảng startedAt–endedAt (không lưu category).
      const hours = sample.endedAt
        ? Math.round(((Date.parse(sample.endedAt) - Date.parse(sample.startedAt)) / 3_600_000) * 100) / 100
        : sample.value // fallback khi thiếu endedAt
      return { type: 'sleep', value: hours, unit: 'hours', taken_at: sample.startedAt }
    }
  }
}

/** Chuẩn hóa danh sách mẫu → summary chưa dedupe. */
export function summarizeSamples(samples: HealthKitSample[]): Omit<HealthSyncSummary, 'duplicates'> {
  const measurements: HealthMetricInput[] = []
  const skippedMap = new Map<string, number>()
  for (const s of samples) {
    const m = toHealthMetric(s)
    if (m) measurements.push(m)
    else skippedMap.set(s.type, (skippedMap.get(s.type) ?? 0) + 1)
  }
  return {
    accepted: measurements.length,
    skipped: [...skippedMap.entries()].map(([type, count]) => ({ type, count })),
    measurements,
  }
}

/**
 * Key chống trùng: `healthkit:<type>:<epoch_ms>`. So epoch ms (Date.parse) để
 * né lệch ký hiệu offset ISO ('Z' vs '+00:00') giữa iOS và DB.
 */
export function healthMetricKey(m: Pick<HealthMetricInput, 'type' | 'taken_at'>): string {
  return `healthkit:${m.type}:${Date.parse(m.taken_at)}`
}

/** Dedupe danh sách mới với tập key đã có; không ghi đè dữ liệu nguồn khác. */
export function dedupeHealthMetrics(
  rows: HealthMetricInput[],
  existingKeys: Set<string>,
): { kept: HealthMetricInput[]; duplicates: number } {
  const seen = new Set(existingKeys)
  const kept: HealthMetricInput[] = []
  let duplicates = 0
  for (const r of rows) {
    const key = healthMetricKey(r)
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key)
    kept.push(r)
  }
  return { kept, duplicates }
}

/** Interface con cho route — DataApi không khai báo (api.ts bất biến), ép kiểu tại route. */
export interface HealthSyncDataApi {
  upsertHealthMetric(rows: HealthMetricInput[]): Promise<{ created: D.MaternalMeasurement[]; duplicates: number }>
}

// ---------------------------------------------------------------------------
// Self-check: parse payload mẫu + dedupe.
// Chạy: cd apps/web && node --experimental-strip-types lib/health-sync.ts
// ---------------------------------------------------------------------------
function demo(): void {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error(`health-sync.demo: ${msg}`)
  }

  const payload = {
    source: 'healthkit',
    samples: [
      { id: 'HK-W1', type: 'weight', value: 57.2, unit: 'kg', source: 'healthkit', startedAt: '2026-08-03T07:00:00Z' },
      { id: 'HK-BP1', type: 'blood_pressure', value: 120, unit: 'mmHg', source: 'healthkit', startedAt: '2026-08-03T08:00:00Z', auxiliary: 78 },
      { id: 'HK-HR1', type: 'heart_rate', value: 72, unit: 'lần/phút', source: 'healthkit', startedAt: '2026-08-03T09:00:00+07:00' },
      { id: 'HK-STEPS', type: 'activity', value: 8200, unit: 'bước', source: 'healthkit', startedAt: '2026-08-03T23:00:00Z' },
      { id: 'HK-SLEEP', type: 'sleep', value: 1, unit: 'category', source: 'healthkit', startedAt: '2026-08-02T22:00:00Z', endedAt: '2026-08-03T06:00:00Z' },
    ],
  }

  const parsed = healthSyncEnvelopeSchema.safeParse(payload)
  assert(parsed.success, 'envelope hợp lệ')

  const summary = summarizeSamples(parsed.data!.samples)
  assert(summary.accepted === 5, `accepted = 5 (weight+bp+hr+activity+sleep)`)
  assert(summary.skipped.length === 0, 'không còn skipped activity/sleep')
  const bp = summary.measurements.find((m) => m.type === 'blood_pressure')!
  assert(bp.diastolic === 78 && bp.value === 120, 'blood_pressure systolic + diastolic')
  const steps = summary.measurements.find((m) => m.type === 'activity')!
  assert(steps.value === 8200 && steps.unit === 'steps', 'activity → steps')
  const sleep = summary.measurements.find((m) => m.type === 'sleep')!
  assert(sleep.value === 8 && sleep.unit === 'hours', 'sleep → 8h (startedAt–endedAt)')

  // Dedupe: lần gửi lại đúng mẫu → báo duplicates, không thêm dòng mới.
  const keys = new Set(summary.measurements.map(healthMetricKey))
  const replayed = summarizeSamples(parsed.data!.samples).measurements
  const { kept, duplicates } = dedupeHealthMetrics(replayed, keys)
  assert(kept.length === 0 && duplicates === 5, 'replay dedupe hết 5')

  // Đổi offset ISO ('Z' vs '+07:00') của cùng thời điểm vẫn tính là trùng.
  const sameInstant = { ...summary.measurements[0]!, taken_at: '2026-08-03T14:00:00+07:00' }
  const { kept: k2 } = dedupeHealthMetrics([sameInstant], keys)
  assert(k2.length === 0, 'dedupe theo epoch, né lệch offset')

  console.log('✅ health-sync.demo OK — parse, normalize, dedupe (source+type+taken_at) hợp lệ')
}

const isMain = (): boolean =>
  (globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('health-sync.ts') === true
if (isMain()) void demo()
