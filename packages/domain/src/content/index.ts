import { z } from 'zod'
import {
  idSchema,
  baseEntitySchema,
  contentSourceTypeSchema,
  knowledgeStageSchema,
  trimesterSchema,
} from '../core'

// ===========================================================================
// Nội dung: content_sources, articles, weekly_guides, alert_rules,
// content_versions. Nội dung y khoa có nguồn + phiên bản + ngày cập nhật.
// ===========================================================================

// ---- content_sources (nguồn tài liệu/URL đã import) ----
export const contentSourceSchema = baseEntitySchema.extend({
  source_type: contentSourceTypeSchema,
  title: z.string().min(1).max(200),
  url: z.string().url().nullable(),
  file_url: z.string().url().nullable(),
  status: z.enum(['uploaded', 'processing', 'ready', 'failed']),
  error: z.string().max(500).nullable(),
  notes: z.string().max(1000).nullable(),
})
export type ContentSource = z.infer<typeof contentSourceSchema>

// ---- articles (nội dung y khoa chính thống) ----
export const articleSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  summary: z.string().max(1000).nullable(),
  body: z.string().min(1),
  /** Nguồn trích dẫn (vd "Bệnh viện Từ Dũ", "Bộ Y tế", URL) — tách khỏi body. */
  source: z.string().max(500).nullable(),
  /** Phiên bản nội dung (kết hợp content_versions). */
  version: z.number().int().nonnegative(),
  stages: z.array(knowledgeStageSchema),
  tags: z.array(z.string().max(60)),
  author: z.string().max(120).nullable(),
  published_at: z.string().datetime({ offset: true }).nullable(),
  medical_reviewed: z.boolean(),
})
export type Article = z.infer<typeof articleSchema>

// ---- weekly_guides ----
export const weeklyGuideSchema = baseEntitySchema.extend({
  week: z.number().int().min(1).max(42),
  trimester: trimesterSchema,
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  nutrition_focus: z.array(z.string()),
  appointments_due: z.array(z.string()),
  todo: z.array(z.string()),
})
export type WeeklyGuide = z.infer<typeof weeklyGuideSchema>

// ---- alert_rules (rule engine, cảnh báo khẩn) ----
export const alertRuleSchema = baseEntitySchema.extend({
  trigger_type: z.string().min(1).max(80),
  trigger_value: z.string().max(200).nullable(),
  message: z.string().min(1).max(500),
  severity: z.enum(['info', 'warning', 'critical']),
  active: z.boolean(),
})
export type AlertRule = z.infer<typeof alertRuleSchema>

// ---- content_versions (phiên bản nội dung) ----
export const contentVersionSchema = baseEntitySchema.extend({
  content_type: z.enum(['article', 'weekly_guide', 'knowledge_source']),
  content_id: idSchema,
  version: z.number().int().nonnegative(),
  body: z.string().min(1),
  changelog: z.string().max(500).nullable(),
  created_by: idSchema.nullable(),
  published_at: z.string().datetime({ offset: true }).nullable(),
})
export type ContentVersion = z.infer<typeof contentVersionSchema>
