import { z } from 'zod'
import {
  idSchema,
  baseEntitySchema,
  withSource,
  genderSchema,
  birthTypeSchema,
  feedingMethodSchema,
  feedingSideSchema,
  sleepPlaceSchema,
  diaperTypeSchema,
  milestoneStatusSchema,
  reminderFrequencySchema,
} from '../core'
import { dateSchema } from '../pregnancy'

// ===========================================================================
// Sau sinh & bé: birth_records, children, feeding_logs, sleep_logs, diaper_logs,
// growth_measurements, milestones, vaccinations, child_medications.
// ===========================================================================

// ---- birth_records ----
export const birthRecordSchema = baseEntitySchema.extend({
  pregnancy_id: idSchema.nullable(),
  birth_date: dateSchema,
  birth_type: birthTypeSchema,
  hospital: z.string().max(200).nullable(),
  duration_hours: z.number().positive().nullable(),
  complications: z.array(z.string().max(100)),
  notes: z.string().max(2000).nullable(),
})
export type BirthRecord = z.infer<typeof birthRecordSchema>

// ---- children ----
export const childSchema = baseEntitySchema.extend({
  birth_record_id: idSchema.nullable(),
  name: z.string().min(1).max(120),
  sex: genderSchema,
  birth_date: dateSchema,
  birth_weight_kg: z.number().positive().nullable(),
  birth_length_cm: z.number().positive().nullable(),
  head_circumference_cm: z.number().positive().nullable(),
  blood_type: z.string().max(10).nullable(),
  allergies: z.array(z.string().max(100)),
})
export type Child = z.infer<typeof childSchema>

// ---- feeding_logs (nguồn ghi: manual/healthkit) ----
export const feedingLogSchema = withSource(
  baseEntitySchema.extend({
    child_id: idSchema,
    method: feedingMethodSchema,
    side: feedingSideSchema.nullable(),
    amount_ml: z.number().nonnegative().nullable(),
    started_at: z.string().datetime({ offset: true }),
    duration_min: z.number().nonnegative().nullable(),
    note: z.string().max(500).nullable(),
  }),
)
export type FeedingLog = z.infer<typeof feedingLogSchema>

// ---- sleep_logs ----
export const sleepLogSchema = baseEntitySchema.extend({
  child_id: idSchema,
  started_at: z.string().datetime({ offset: true }),
  ended_at: z.string().datetime({ offset: true }).nullable(),
  place: sleepPlaceSchema,
  note: z.string().max(500).nullable(),
})
export type SleepLog = z.infer<typeof sleepLogSchema>

// ---- diaper_logs ----
export const diaperLogSchema = baseEntitySchema.extend({
  child_id: idSchema,
  changed_at: z.string().datetime({ offset: true }),
  type: diaperTypeSchema,
  note: z.string().max(500).nullable(),
})
export type DiaperLog = z.infer<typeof diaperLogSchema>

// ---- growth_measurements ----
export const GROWTH_TYPES = ['weight', 'height', 'head_circumference'] as const
export const growthTypeSchema = z.enum(GROWTH_TYPES)
export type GrowthType = z.infer<typeof growthTypeSchema>

export const growthMeasurementSchema = withSource(
  baseEntitySchema.extend({
    child_id: idSchema,
    type: growthTypeSchema,
    value: z.number(),
    unit: z.string().max(20),
    measured_at: z.string().datetime({ offset: true }),
    note: z.string().max(500).nullable(),
  }),
)
export type GrowthMeasurement = z.infer<typeof growthMeasurementSchema>

// ---- milestones ----
export const milestoneSchema = baseEntitySchema.extend({
  child_id: idSchema,
  name: z.string().min(1).max(200),
  stage: z.string().max(60).nullable(),
  achieved_at: z.string().datetime({ offset: true }).nullable(),
  status: milestoneStatusSchema,
  note: z.string().max(500).nullable(),
})
export type Milestone = z.infer<typeof milestoneSchema>

// ---- vaccinations ----
export const vaccinationSchema = baseEntitySchema.extend({
  child_id: idSchema,
  vaccine_name: z.string().min(1).max(120),
  dose_number: z.number().int().positive().nullable(),
  scheduled_date: dateSchema,
  administered_date: dateSchema.nullable(),
  location: z.string().max(200).nullable(),
  notes: z.string().max(1000).nullable(),
})
export type Vaccination = z.infer<typeof vaccinationSchema>

// ---- child_medications ----
export const childMedicationSchema = baseEntitySchema.extend({
  child_id: idSchema,
  medication_name: z.string().min(1).max(120),
  dosage: z.string().max(100),
  unit: z.string().max(40),
  frequency: reminderFrequencySchema,
  start_date: dateSchema.nullable(),
  end_date: dateSchema.nullable(),
  note: z.string().max(1000).nullable(),
})
export type ChildMedication = z.infer<typeof childMedicationSchema>
