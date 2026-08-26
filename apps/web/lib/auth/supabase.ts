// ===========================================================================
// Auth — seam Supabase. Chỉ dùng khi có env NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.
// Client anon + supabase.auth; RLS của các bảng dữ liệu đã nối ở lib/data.
//
// Đăng ký: ngoài signUp, tạo `profiles` + gia đình (trigger `handle_new_family`
// tự thêm owner + privacy_settings) HOẶC tham gia gia đình theo mã mời qua
// `public.join_family(code)` (security definer — RLS family_members_insert chặn
// người chưa là thành viên).
//
// Phiên máy chủ: ghi access_token vào cookie `sb_token` để server component /
// route handler tạo client đã xác thực (lib/supabase-server.ts). KHÔNG phá
// singleton — browser vẫn dùng client localStorage session như cũ.
// ===========================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthError, AUTH_MESSAGES, registerSchema, loginSchema, generateFamilyCode } from './core'
import type { AuthSession, RegisterInput, LoginInput } from './core'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const AUTH_COOKIE = 'sb_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 ngày (khớp session localStorage)

// ---------------------------------------------------------------------------
// Cookie phiên — cho phía máy chủ (server component/route handler).
// Chỉ ghi khi chạy browser (client); server đọc qua next/headers cookies().
// ---------------------------------------------------------------------------
function writeAuthCookie(token: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
}

function clearAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`
}

// Session trả về từ supabase.auth — chỉ lấy phần ta cần (tránh lệ thuộc type nội bộ).
interface RawSession {
  access_token: string
  expires_at?: number
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null
}

function toSession(data: { session: RawSession | null }): AuthSession | null {
  const s = data.session
  if (!s?.user) return null
  const meta = s.user.user_metadata as { name?: string } | undefined
  return {
    token: s.access_token,
    user_id: s.user.id,
    email: s.user.email ?? '',
    name: meta?.name ?? null,
    expiresAt: (s.expires_at ?? 0) * 1000,
  }
}

function supabaseError(e: { code?: string; message?: string }): AuthError {
  const code = e.code ?? ''
  if (code === 'user_already_exists') return new AuthError('EMAIL_EXISTS', AUTH_MESSAGES.EMAIL_EXISTS)
  if (code === 'invalid_credentials' || code === 'email_not_confirmed') {
    return new AuthError('INVALID_CREDENTIALS', AUTH_MESSAGES.INVALID_CREDENTIALS)
  }
  return new AuthError('SUPABASE', e.message ?? AUTH_MESSAGES.UNKNOWN)
}

/**
 * Client có token của session mới (dùng cho việc tạo profile/gia đình ngay sau
 * signUp/login — chắc chắn JWT hợp lệ bất kể client nội bộ đã lưu session chưa).
 */
function authedClient(token: string): SupabaseClient {
  if (SB_URL && SB_ANON) {
    return createClient(SB_URL, SB_ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  if (!supabase) throw new AuthError('NO_SUPABASE', AUTH_MESSAGES.UNKNOWN)
  return supabase
}

interface SupabaseUser {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

/**
 * Đảm bảo hồ sơ + gia đình cho user vừa đăng nhập (idempotent) — phủ trường hợp
 * confirm email ON (signUp không có session nên chưa tạo được profile/gia đình):
 *   1. Tạo `profiles` nếu chưa có (RLS profiles_own: auth.uid() = id).
 *   2. Đã thuộc gia đình → thôi.
 *   3. Có mã mời (metadata.invite_code) → tham gia; mã sai → tạo gia đình mới.
 *   4. Không mã mời → tạo gia đình mới (trigger tự thêm owner + privacy_settings).
 */
async function ensureUserSetupOnLogin(user: SupabaseUser, client: SupabaseClient): Promise<void> {
  const meta = user.user_metadata as { name?: string; invite_code?: string } | undefined
  const fullName = meta?.name ?? user.email ?? 'Người dùng'
  await client.from('profiles').upsert(
    { id: user.id, full_name: fullName, updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  )
  const { data: members } = await client
    .from('family_members')
    .select('family_id')
    .eq('user_id', user.id)
    .limit(1)
  if (members && members.length > 0) return

  const invite = meta?.invite_code?.trim()
  if (invite) {
    const { data: fid } = await client.rpc('join_family', { code: invite })
    if (fid) return
    // Mã mời đã hết hạn/xoá → tạo gia đình mới (không chặn đăng nhập).
  }
  const { error: famErr } = await client.from('families').insert({
    name: `Gia đình của ${fullName}`,
    code: generateFamilyCode(),
  })
  if (famErr) throw famErr
}

export async function supabaseRegister(input: RegisterInput): Promise<AuthSession | null> {
  if (!supabase) throw new AuthError('NO_SUPABASE', AUTH_MESSAGES.UNKNOWN)
  const parsed = registerSchema.parse(input)
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      data: {
        ...(parsed.name ? { name: parsed.name } : {}),
        // Lưu mã mời vào metadata để tạo gia đình đúng sau khi xác nhận email (confirm ON).
        invite_code: parsed.inviteCode?.trim().toUpperCase() ?? null,
      },
    },
  })
  if (error) throw supabaseError(error)

  // Confirm email ON → signUp trả session null → UI hiện thông báo kiểm tra email.
  // Profile + gia đình sẽ được tạo ở lần đăng nhập đầu tiên (ensureUserSetupOnLogin).
  const session = toSession(data)
  if (!session) return null

  // Có session (confirm email OFF) → tạo profile + gia đình/tham gia ngay.
  const client = authedClient(session.token)
  const fullName = parsed.name ?? session.email
  // Profile không bắt buộc chặn đăng ký — signUp đã thành công, lần login sau
  // sẽ tạo/upsert lại nếu thiếu (ensureUserSetupOnLogin). Gia đình là bắt buộc.
  const { error: profileErr } = await client.from('profiles').upsert(
    { id: session.user_id, full_name: fullName, updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  )
  if (profileErr) {
    console.warn('[supabase] Tạo/upsert profiles thất bại (sẽ thử lại lúc login):', profileErr.message)
  }

  const invite = parsed.inviteCode?.trim()
  if (invite) {
    const { data: joinedId, error: joinErr } = await client.rpc('join_family', { code: invite })
    if (joinErr) throw supabaseError(joinErr)
    if (!joinedId) throw new AuthError('INVITE_INVALID', AUTH_MESSAGES.INVITE_INVALID)
  } else {
    const { error: famErr } = await client.from('families').insert({
      name: `Gia đình của ${fullName}`,
      code: generateFamilyCode(),
    })
    if (famErr) throw supabaseError(famErr)
  }
  writeAuthCookie(session.token)
  return session
}

export async function supabaseLogin(input: LoginInput): Promise<AuthSession> {
  if (!supabase) throw new AuthError('NO_SUPABASE', AUTH_MESSAGES.UNKNOWN)
  const parsed = loginSchema.parse(input)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  })
  if (error) throw supabaseError(error)
  const session = toSession(data)
  if (!session) throw new AuthError('NO_SESSION', AUTH_MESSAGES.UNKNOWN)
  // Confirm email ON trước đó → user chưa có profile/gia đình → tạo ở đây.
  const u = data.user as SupabaseUser | null
  if (u) await ensureUserSetupOnLogin(u, authedClient(session.token))
  writeAuthCookie(session.token)
  return session
}

export async function supabaseGetSession(): Promise<AuthSession | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  const session = toSession(data)
  if (session) writeAuthCookie(session.token)
  else clearAuthCookie()
  return session
}

export async function supabaseLogout(): Promise<void> {
  await supabase?.auth.signOut()
  clearAuthCookie()
}
