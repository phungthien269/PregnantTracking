import { z } from 'zod'
import {
  idSchema,
  baseEntitySchema,
  familyScopedSchema,
  knowledgeStageSchema,
  chatRoleSchema,
  quizQuestionTypeSchema,
  quizAttemptStatusSchema,
} from '../core'

// ===========================================================================
// AI & học: chat_sessions, chat_messages, ai_consents, knowledge_sources,
// knowledge_chunks, knowledge_stage_tags, quiz_sets, quiz_questions,
// quiz_attempts, question_reports.
// ===========================================================================

// ---- chat_sessions ----
export const chatSessionSchema = baseEntitySchema.extend({
  title: z.string().max(200).nullable(),
  stage: knowledgeStageSchema.nullable(),
  model: z.string().max(100).nullable(),
  status: z.enum(['active', 'archived']),
  pinned: z.boolean(),
})
export type ChatSession = z.infer<typeof chatSessionSchema>

// ---- chat_messages (có thể khóa riêng) ----
export const chatMessageSchema = baseEntitySchema.extend({
  session_id: idSchema,
  role: chatRoleSchema,
  content: z.string().min(1),
  sources: z.array(idSchema),
})
export type ChatMessage = z.infer<typeof chatMessageSchema>

// ---- ai_consents (đồng ý một lần, luôn hiện model) ----
export const aiConsentSchema = familyScopedSchema.extend({
  id: idSchema,
  user_id: idSchema,
  granted_at: z.string().datetime({ offset: true }),
  revoked_at: z.string().datetime({ offset: true }).nullable(),
  model_provider: z.string().max(100),
  version: z.string().max(20),
  created_at: z.string().datetime({ offset: true }),
})
export type AIConsent = z.infer<typeof aiConsentSchema>

// ---- knowledge_sources (thư viện của bạn) ----
export const knowledgeSourceSchema = baseEntitySchema.extend({
  content_source_id: idSchema.nullable(),
  title: z.string().min(1).max(200),
  stage: knowledgeStageSchema.nullable(),
  status: z.enum(['processing', 'ready', 'failed']),
  chunk_count: z.number().int().nonnegative().nullable(),
})
export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>

// ---- knowledge_chunks (embedding vector cho pgvector) ----
export const knowledgeChunkSchema = baseEntitySchema.extend({
  knowledge_source_id: idSchema,
  content: z.string().min(1),
  citation: z.string().max(500),
  position: z.number().int().nonnegative(),
  embedding: z.array(z.number()).nullable(),
})
export type KnowledgeChunk = z.infer<typeof knowledgeChunkSchema>

// ---- knowledge_stage_tags ----
export const knowledgeStageTagSchema = baseEntitySchema.extend({
  knowledge_source_id: idSchema,
  stage: knowledgeStageSchema,
  confirmed_by: idSchema.nullable(),
  confirmed_at: z.string().datetime({ offset: true }).nullable(),
})
export type KnowledgeStageTag = z.infer<typeof knowledgeStageTagSchema>

// ---- quiz_sets (chỉ dùng nguồn người dùng import) ----
export const quizSetSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  stage: knowledgeStageSchema.nullable(),
  source_ids: z.array(idSchema),
  status: z.enum(['draft', 'ready']),
  question_count: z.number().int().nonnegative().nullable(),
})
export type QuizSet = z.infer<typeof quizSetSchema>

// ---- quiz_questions ----
export const quizQuestionSchema = baseEntitySchema.extend({
  quiz_set_id: idSchema,
  type: quizQuestionTypeSchema,
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correct_index: z.number().int().nonnegative(),
  explanation: z.string().max(2000),
  citation: z.string().max(500).nullable(),
})
export type QuizQuestion = z.infer<typeof quizQuestionSchema>

// ---- quiz_attempts (tiến độ riêng từng người) ----
export const quizAttemptSchema = baseEntitySchema.extend({
  quiz_set_id: idSchema,
  user_id: idSchema,
  status: quizAttemptStatusSchema,
  score: z.number().int().nonnegative().nullable(),
  correct_count: z.number().int().nonnegative().nullable(),
  total_questions: z.number().int().positive().nullable(),
  started_at: z.string().datetime({ offset: true }),
  completed_at: z.string().datetime({ offset: true }).nullable(),
})
export type QuizAttempt = z.infer<typeof quizAttemptSchema>

// ---- question_reports (báo lỗi câu hỏi) ----
export const questionReportSchema = baseEntitySchema.extend({
  quiz_question_id: idSchema,
  reporter_id: idSchema,
  reason: z.string().min(1).max(1000),
  status: z.enum(['open', 'resolved', 'rejected']),
})
export type QuestionReport = z.infer<typeof questionReportSchema>
