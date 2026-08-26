import { z } from 'zod'
import {
  idSchema,
  baseEntitySchema,
  withSource,
  genderSchema,
  pregnancyStatusSchema,
  measurementTypeSchema,
  symptomSeveritySchema,
  fetalMovementFeelingSchema,
  appointmentTypeSchema,
  documentStatusSchema,
  extractionStatusSchema,
} from '../core'

// ===========================================================================
// Thai kỳ: pregnancies, fetuses, health_profiles, pregnancy_week_snapshots,
// maternal_measurements, symptom_reports, fetal_movement_logs, appointments,
// document_records, document_extractions.
// ===========================================================================

/** Ngày (YYYY-MM-DD) theo múi giờ Asia/Ho_Chi_Minh. */
export const dateSchema = z.string().date()
export type DateStr = z.infer<typeof dateSchema>

// ---- pregnancies ----
export const pregnancySchema = withSource(
  baseEntitySchema.extend({
    lmp: dateSchema.nullable(), // ngày đầu kỳ kinh cuối
    edd: dateSchema.nullable(), // ngày dự sinh
    status: pregnancyStatusSchema,
    notes: z.string().max(2000).nullable(),
  }),
)
export type Pregnancy = z.infer<typeof pregnancySchema>

// ---- fetuses (hỗ trợ đa thai) ----
export const fetusSchema = baseEntitySchema.extend({
  pregnancy_id: idSchema,
  name: z.string().max(60).nullable(),
  sex: genderSchema,
  birth_order: z.number().int().min(1),
  notes: z.string().max(1000).nullable(),
})
export type Fetus = z.infer<typeof fetusSchema>

// ---- health_profiles ----
export const bloodTypeSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'])
export type BloodType = z.infer<typeof bloodTypeSchema>

export const healthProfileSchema = baseEntitySchema.extend({
  pregnancy_id: idSchema,
  height_cm: z.number().positive().nullable(),
  pre_pregnancy_weight_kg: z.number().positive().nullable(),
  blood_type: bloodTypeSchema,
  allergies: z.array(z.string().max(100)),
  preexisting_conditions: z.array(z.string().max(100)),
  notes: z.string().max(2000).nullable(),
})
export type HealthProfile = z.infer<typeof healthProfileSchema>

// ---- pregnancy_week_snapshots ----
export const pregnancyWeekSnapshotSchema = baseEntitySchema.extend({
  pregnancy_id: idSchema,
  week: z.number().int().min(1).max(42),
  snapshot_date: dateSchema,
  fetal_length_cm: z.number().positive().nullable(),
  fetal_weight_g: z.number().positive().nullable(),
  mom_changes: z.array(z.string()),
  nutrition_focus: z.array(z.string()),
  todo: z.array(z.string()),
})
export type PregnancyWeekSnapshot = z.infer<typeof pregnancyWeekSnapshotSchema>

// ---- maternal_measurements (nguồn: manual/healthkit/document) ----
export const maternalMeasurementSchema = withSource(
  baseEntitySchema.extend({
    pregnancy_id: idSchema,
    type: measurementTypeSchema,
    value: z.number(),
    unit: z.string().max(20),
    /** Huyết áp: giá trị tâm thu ở `value`, tâm trương ở đây. */
    diastolic: z.number().nullable().optional(),
    taken_at: z.string().datetime({ offset: true }),
    note: z.string().max(1000).nullable(),
  }),
)
export type MaternalMeasurement = z.infer<typeof maternalMeasurementSchema>

// ---- symptom_reports (có thể khóa riêng) ----
export const symptomReportSchema = withSource(
  baseEntitySchema.extend({
    pregnancy_id: idSchema,
    symptom: z.string().min(1).max(100),
    severity: symptomSeveritySchema,
    started_at: z.string().datetime({ offset: true }),
    ended_at: z.string().datetime({ offset: true }).nullable(),
    note: z.string().max(2000).nullable(),
  }),
)
export type SymptomReport = z.infer<typeof symptomReportSchema>

// ---- fetal_movement_logs (chỉ xu hướng cảm nhận) ----
export const fetalMovementLogSchema = baseEntitySchema.extend({
  pregnancy_id: idSchema,
  felt_at: z.string().datetime({ offset: true }),
  feeling: fetalMovementFeelingSchema,
  duration_min: z.number().int().positive().nullable(),
  note: z.string().max(500).nullable(),
})
export type FetalMovementLog = z.infer<typeof fetalMovementLogSchema>

// ---- appointments ----
export const appointmentSchema = baseEntitySchema.extend({
  pregnancy_id: idSchema,
  type: appointmentTypeSchema,
  scheduled_at: z.string().datetime({ offset: true }),
  location: z.string().max(200).nullable(),
  doctor: z.string().max(120).nullable(),
  summary_before: z.string().max(3000).nullable(),
  outcome: z.string().max(3000).nullable(),
  notes: z.string().max(3000).nullable(),
  followup_at: z.string().datetime({ offset: true }).nullable(),
  /** Đơn thuốc — ghi sau buổi khám (Phase 6). Tuỳ chọn để tương thích ngược seed cũ. */
  prescription: z.string().max(2000).nullable().optional(),
  /** Việc cần làm sau buổi khám (Phase 6) — mỗi mục tối đa 200 ký tự. */
  tasks_after: z.array(z.string().max(200)).nullable().optional(),
})
export type Appointment = z.infer<typeof appointmentSchema>

// ---- document_records (giấy khám, kết quả) ----
export const documentRecordSchema = withSource(
  baseEntitySchema.extend({
    pregnancy_id: idSchema,
    title: z.string().min(1).max(200),
    file_name: z.string().max(255).nullable(),
    file_url: z.string().url().nullable(),
    status: documentStatusSchema,
    notes: z.string().max(2000).nullable(),
  }),
)
export type DocumentRecord = z.infer<typeof documentRecordSchema>

// ---- document_extractions (OCR, chờ người dùng xác nhận) ----
export const documentExtractionSchema = baseEntitySchema.extend({
  document_id: idSchema,
  field_name: z.string().min(1).max(100),
  raw_value: z.string().max(500),
  normalized_value: z.string().max(500).nullable(),
  status: extractionStatusSchema,
  confidence: z.number().min(0).max(1).nullable(),
  confirmed_by: idSchema.nullable(),
})
export type DocumentExtraction = z.infer<typeof documentExtractionSchema>
