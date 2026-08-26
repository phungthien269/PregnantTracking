import { z } from 'zod'
import {
  idSchema,
  timestampSchema,
  baseEntitySchema,
  familyScopedSchema,
} from '../core'

// ===========================================================================
// Gia đình: profiles, families, family_members, privacy_settings, consents,
// audit_events. Bảng ngoài auth.users đều kế thừa baseEntitySchema (family_id +
// private_owner_id + id/created_at/updated_at).
// ===========================================================================

// ---- profiles (FK auth.users, không có family_id) ----
export const profileSchema = z.object({
  id: idSchema, // = auth.users.id
  full_name: z.string().min(1).max(120),
  avatar_url: z.string().url().nullable(),
  phone: z.string().max(20).nullable(),
  birth_date: z.string().date().nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
})
export type Profile = z.infer<typeof profileSchema>

// ---- families (gốc, không có family_id) ----
export const familySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(120),
  created_at: timestampSchema,
  updated_at: timestampSchema,
})
export type Family = z.infer<typeof familySchema>

// ---- family_members ----
export const FAMILY_ROLES = ['owner', 'member'] as const
export const familyRoleSchema = z.enum(FAMILY_ROLES)
export type FamilyRole = z.infer<typeof familyRoleSchema>

export const familyMemberSchema = z.object({
  id: idSchema,
  family_id: idSchema,
  user_id: idSchema,
  role: familyRoleSchema,
  invited_at: timestampSchema,
  joined_at: timestampSchema.nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
})
export type FamilyMember = z.infer<typeof familyMemberSchema>

// ---- privacy_settings (mặc định chia sẻ trong gia đình) ----
export const privacySettingsSchema = familyScopedSchema.extend({
  id: idSchema,
  share_measurements: z.boolean(),
  share_symptoms: z.boolean(),
  share_documents: z.boolean(),
  share_chat: z.boolean(),
  updated_at: timestampSchema,
})
export type PrivacySettings = z.infer<typeof privacySettingsSchema>

// ---- consents (AI, export, ...) ----
export const CONSENT_TYPES = ['ai_chat', 'ai_analysis', 'data_export', 'notifications'] as const
export const consentTypeSchema = z.enum(CONSENT_TYPES)
export type ConsentType = z.infer<typeof consentTypeSchema>

export const consentSchema = familyScopedSchema.extend({
  id: idSchema,
  user_id: idSchema,
  consent_type: consentTypeSchema,
  granted_at: timestampSchema,
  revoked_at: timestampSchema.nullable(),
  version: z.string().max(20),
  created_at: timestampSchema,
})
export type Consent = z.infer<typeof consentSchema>

// ---- audit_events (KHÔNG chứa dữ liệu sức khỏe) ----
export const auditEventSchema = z.object({
  id: idSchema,
  family_id: idSchema,
  actor_user_id: idSchema,
  action: z.string().min(1).max(80),
  resource_type: z.string().min(1).max(80),
  resource_id: idSchema.nullable(),
  created_at: timestampSchema,
})
export type AuditEvent = z.infer<typeof auditEventSchema>

// ---- helpers ----
export interface Accessible {
  family_id: string
  private_owner_id: string | null
}

export function isFamilyMember(members: FamilyMember[], userId: string): boolean {
  return members.some((m) => m.user_id === userId)
}

/** true nếu mục dùng chung (private_owner_id null) hoặc chính chủ sở hữu. */
export function canAccess(item: Accessible, userId: string): boolean {
  if (item.private_owner_id === null) return true
  return item.private_owner_id === userId
}
