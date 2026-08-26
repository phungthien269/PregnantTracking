import { z } from 'zod'

// ===========================================================================
// Mẹ & Bé — domain core (khế ước dùng chung)
// Mọi schema domain phải import từ đây để đồng bộ tên enum với Supabase.
// ===========================================================================

// ---------------------------------------------------------------------------
// Base primitives
// ---------------------------------------------------------------------------

export const idSchema = z.string().uuid().describe('UUID primary key')
export type Id = z.infer<typeof idSchema>

export const timestampSchema = z.string().datetime({ offset: true })
export type Timestamp = z.infer<typeof timestampSchema>

/** Mọi bảng thuộc gia đình đều có family_id; RLS chỉ cho thành viên cùng gia đình. */
export const familyScopedSchema = z.object({
  family_id: idSchema,
})

/** Mục có thể khóa riêng cho một thành viên (private_owner_id); null = dùng chung. */
export const privateOwnerSchema = z.object({
  private_owner_id: idSchema.nullable(),
})

export const baseEntitySchema = familyScopedSchema.merge(privateOwnerSchema).extend({
  id: idSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
})
export type BaseEntity = z.infer<typeof baseEntitySchema>

/** Envelope API chuẩn: { data } hoặc { error: { code, message, details } } */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type ApiError = z.infer<typeof apiErrorSchema>

export const cursorSchema = z.object({
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
})
export type Cursor = z.infer<typeof cursorSchema>

// ---------------------------------------------------------------------------
// Enums chuẩn (đặt tên trùng với enum type trong Supabase migrations)
// ---------------------------------------------------------------------------

export const DATA_SOURCES = ['manual', 'healthkit', 'document'] as const
export const dataSourceSchema = z.enum(DATA_SOURCES)
export type DataSource = z.infer<typeof dataSourceSchema>

export const GENDERS = ['male', 'female', 'unknown'] as const
export const genderSchema = z.enum(GENDERS)
export type Gender = z.infer<typeof genderSchema>

export const TRIMESTERS = ['first', 'second', 'third'] as const
export const trimesterSchema = z.enum(TRIMESTERS)
export type Trimester = z.infer<typeof trimesterSchema>

// ---- Thai kỳ & sức khỏe ----
export const PREGNANCY_STATUSES = ['ongoing', 'birth_recorded', 'ended'] as const
export const pregnancyStatusSchema = z.enum(PREGNANCY_STATUSES)
export type PregnancyStatus = z.infer<typeof pregnancyStatusSchema>

export const MEASUREMENT_TYPES = [
  'weight',
  'blood_pressure',
  'blood_glucose',
  'waist_circumference',
  'bmi',
  'fundal_height',
  'heart_rate',
  'activity', // bước chân (HealthKit stepCount)
  'sleep', // giấc ngủ (HealthKit sleepAnalysis, lưu số giờ)
] as const
export const measurementTypeSchema = z.enum(MEASUREMENT_TYPES)
export type MeasurementType = z.infer<typeof measurementTypeSchema>

export const SYMPTOM_SEVERITIES = ['mild', 'moderate', 'severe'] as const
export const symptomSeveritySchema = z.enum(SYMPTOM_SEVERITIES)
export type SymptomSeverity = z.infer<typeof symptomSeveritySchema>

export const FETAL_MOVEMENT_FEELINGS = ['normal', 'reduced', 'absent', 'strong'] as const
export const fetalMovementFeelingSchema = z.enum(FETAL_MOVEMENT_FEELINGS)
export type FetalMovementFeeling = z.infer<typeof fetalMovementFeelingSchema>

export const APPOINTMENT_TYPES = [
  'first_visit',
  'prenatal',
  'ultrasound',
  'blood_test',
  'screening',
  'vaccination',
  'postpartum_check',
  'baby_check',
] as const
export const appointmentTypeSchema = z.enum(APPOINTMENT_TYPES)
export type AppointmentType = z.infer<typeof appointmentTypeSchema>

export const DOCUMENT_STATUSES = ['uploaded', 'processing', 'ready', 'failed'] as const
export const documentStatusSchema = z.enum(DOCUMENT_STATUSES)
export type DocumentStatus = z.infer<typeof documentStatusSchema>

export const EXTRACTION_STATUSES = ['pending', 'awaiting_confirmation', 'confirmed', 'rejected'] as const
export const extractionStatusSchema = z.enum(EXTRACTION_STATUSES)
export type ExtractionStatus = z.infer<typeof extractionStatusSchema>

// ---- Dinh dưỡng ----
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'] as const
export const mealTypeSchema = z.enum(MEAL_TYPES)
export type MealType = z.infer<typeof mealTypeSchema>

export const DIETARY_PATTERNS = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'low_carb', 'other'] as const
export const dietaryPatternSchema = z.enum(DIETARY_PATTERNS)
export type DietaryPattern = z.infer<typeof dietaryPatternSchema>

export const SUPPLEMENT_STATUSES = ['prescribed', 'confirmed', 'taken', 'skipped'] as const
export const supplementStatusSchema = z.enum(SUPPLEMENT_STATUSES)
export type SupplementStatus = z.infer<typeof supplementStatusSchema>

export const CONDITION_TYPES = [
  'gestational_diabetes',
  'hypertension',
  'preeclampsia_risk',
  'hypothyroidism',
  'hyperemesis',
  'anemia',
  'cholestasis',
] as const
export const conditionTypeSchema = z.enum(CONDITION_TYPES)
export type ConditionType = z.infer<typeof conditionTypeSchema>

// ---- Sau sinh & bé ----
export const BIRTH_TYPES = ['vaginal', 'c_section', 'assisted'] as const
export const birthTypeSchema = z.enum(BIRTH_TYPES)
export type BirthType = z.infer<typeof birthTypeSchema>

export const FEEDING_METHODS = ['breast', 'pumped_milk', 'formula', 'mixed'] as const
export const feedingMethodSchema = z.enum(FEEDING_METHODS)
export type FeedingMethod = z.infer<typeof feedingMethodSchema>

export const FEEDING_SIDES = ['left', 'right', 'both'] as const
export const feedingSideSchema = z.enum(FEEDING_SIDES)
export type FeedingSide = z.infer<typeof feedingSideSchema>

export const DIAPER_TYPES = ['pee', 'poo', 'mixed'] as const
export const diaperTypeSchema = z.enum(DIAPER_TYPES)
export type DiaperType = z.infer<typeof diaperTypeSchema>

export const SLEEP_PLACES = ['cot', 'bassinet', 'co_sleeping', 'carrier', 'stroller', 'other'] as const
export const sleepPlaceSchema = z.enum(SLEEP_PLACES)
export type SleepPlace = z.infer<typeof sleepPlaceSchema>

export const MILESTONE_STATUSES = ['achieved', 'not_yet', 'questionable'] as const
export const milestoneStatusSchema = z.enum(MILESTONE_STATUSES)
export type MilestoneStatus = z.infer<typeof milestoneStatusSchema>

// ---- Điều phối gia đình ----
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'] as const
export const taskStatusSchema = z.enum(TASK_STATUSES)
export type TaskStatus = z.infer<typeof taskStatusSchema>

export const SHOPPING_STATUSES = ['pending', 'bought', 'cancelled'] as const
export const shoppingStatusSchema = z.enum(SHOPPING_STATUSES)
export type ShoppingStatus = z.infer<typeof shoppingStatusSchema>

export const REMINDER_FREQUENCIES = ['once', 'daily', 'weekly', 'monthly', 'custom'] as const
export const reminderFrequencySchema = z.enum(REMINDER_FREQUENCIES)
export type ReminderFrequency = z.infer<typeof reminderFrequencySchema>

export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'push'] as const
export const notificationChannelSchema = z.enum(NOTIFICATION_CHANNELS)
export type NotificationChannel = z.infer<typeof notificationChannelSchema>

// ---- Nội dung & AI ----
export const CONTENT_SOURCE_TYPES = ['article', 'guide', 'pdf', 'epub', 'url'] as const
export const contentSourceTypeSchema = z.enum(CONTENT_SOURCE_TYPES)
export type ContentSourceType = z.infer<typeof contentSourceTypeSchema>

export const KNOWLEDGE_STAGES = ['pregnancy', 'postpartum', 'newborn', 'age_1_6m', 'age_6_12m', 'age_12_24m'] as const
export const knowledgeStageSchema = z.enum(KNOWLEDGE_STAGES)
export type KnowledgeStage = z.infer<typeof knowledgeStageSchema>

export const CHAT_ROLES = ['user', 'assistant', 'system'] as const
export const chatRoleSchema = z.enum(CHAT_ROLES)
export type ChatRole = z.infer<typeof chatRoleSchema>

export const QUIZ_QUESTION_TYPES = ['multiple_choice', 'scenario'] as const
export const quizQuestionTypeSchema = z.enum(QUIZ_QUESTION_TYPES)
export type QuizQuestionType = z.infer<typeof quizQuestionTypeSchema>

export const QUIZ_ATTEMPT_STATUSES = ['in_progress', 'completed', 'abandoned'] as const
export const quizAttemptStatusSchema = z.enum(QUIZ_ATTEMPT_STATUSES)
export type QuizAttemptStatus = z.infer<typeof quizAttemptStatusSchema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Thêm trường nguồn ghi (manual / healthkit / document) cho một schema đo lường. */
export const withSource = <Shape extends z.ZodRawShape>(schema: z.ZodObject<Shape>) =>
  schema.extend({ source: dataSourceSchema })
