// ===========================================================================
// supabase-bridge.ts — cầu nối phiên app ↔ Supabase Auth (server-only).
//
// App dùng auth riêng (bảng users/sessions) nhưng tầng dữ liệu Supabase cần
// JWT Supabase (auth.uid() cho RLS). Sau khi login/register app thành công:
//   1. signInWithPassword cùng email/password trên auth.users (seed khớp user_id).
//   2. Ghi access_token vào cookie `sb_token` — lib/data/index.ts gắn client
//      request-scoped từ cookie này cho mọi method data.
// Lỗi Supabase được nuốt êm (graceful): app vẫn chạy chế độ local bình thường.
// ===========================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const AUTH_COOKIE = 'sb_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 ngày — khớp phiên app

function url(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL
}
function anonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}
/** Chỉ server runtime đọc được (không NEXT_PUBLIC → không inline vào bundle client). */
function serviceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

function setSessionCookie(res: NextResponse, accessToken: string): void {
  res.cookies.set(AUTH_COOKIE, accessToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })
}

/** Sau login app: cấp JWT Supabase cho cùng email/password (nếu cấu hình Supabase). */
export async function bridgeSupabaseLogin(res: NextResponse, email: string, password: string): Promise<void> {
  const u = url()
  const k = anonKey()
  if (!u || !k) return
  try {
    const client = createClient(u, k, { auth: { persistSession: false } })
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (!error && data.session?.access_token) setSessionCookie(res, data.session.access_token)
  } catch {
    // Nuốt êm — auth Supabase không sẵn sàng không được phép phá login app.
  }
}

/** Sau register app: tạo user auth Supabase (confirm sẵn) rồi cấp JWT. Trả id auth Supabase (hoặc null). */
export async function bridgeSupabaseRegister(
  res: NextResponse,
  email: string,
  password: string,
  name: string,
): Promise<string | null> {
  const u = url()
  const k = anonKey()
  const sk = serviceKey()
  if (!u || !k || !sk) {
    await bridgeSupabaseLogin(res, email, password)
    return null
  }
  let supabaseUserId: string | null = null
  try {
    const admin = createClient(u, sk, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (error && !`${error.message}`.toLowerCase().includes('already')) throw error
    supabaseUserId = data?.user?.id ?? null
  } catch {
    // Bỏ qua — signInWithPassword bên dưới tự quyết định có cookie hay không.
  }
  await bridgeSupabaseLogin(res, email, password)
  return supabaseUserId
}

/**
 * Bootstrap dữ liệu gia đình trên Supabase cho user ĐĂNG KÝ MỚI (service-role,
 * server-only — RLS chặn user tự ghi do chưa thuộc gia đình nào: bootstrap ngược).
 * Mirror gia đình local sang Supabase (CÙNG id) để family_id thống nhất 2 tầng.
 */
export async function bridgeSupabaseFamilyBootstrap(input: {
  authUserId: string | null
  email: string
  familyId: string
  familyCode: string | null
  familyName: string
  role: 'owner' | 'member'
  fullName: string
}): Promise<void> {
  const u = url()
  const sk = serviceKey()
  if (!u || !sk || !input.authUserId) return
  try {
    const admin = createClient(u, sk, { auth: { persistSession: false, autoRefreshToken: false } })
    const now = new Date().toISOString()
    // profiles — id khớp user auth (RLS policies dùng auth.uid()); full_name NOT NULL.
    await admin.from('profiles').upsert(
      { id: input.authUserId, full_name: input.fullName || 'Thành viên', created_at: now, updated_at: now },
      { onConflict: 'id' },
    )
    // Mirror gia đình local sang Supabase (CÙNG id + code) — owner tạo mới, member
    // tham gia gia đình có sẵn: cùng id nên invite code khớp cả 2 tầng.
    await admin.from('families').upsert(
      { id: input.familyId, name: input.familyName, code: input.familyCode, created_at: now, updated_at: now },
      { onConflict: 'id' },
    )
    await admin.from('family_members').upsert(
      {
        family_id: input.familyId,
        user_id: input.authUserId,
        role: input.role,
        joined_at: now,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'family_id,user_id' },
    )
  } catch {
    // Nuốt êm — dữ liệu local luôn là nguồn thật cho phiên hiện tại.
  }
}
