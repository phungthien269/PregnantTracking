// ===========================================================================
// Auth local (Phase 5) — register/login dựa trên SQLite (server route).
//
// - Session token vẫn localStorage (trải nghiệm không đổi), NHƯNG user được
//   validate/tạo ở server qua `POST /api/v1/auth/register|login` (bảng users/
//   families/family_members/sessions trong SQLite). Tài khoản không mất khi
//   restart/clear browser.
// - Sau đăng nhập: ghi session + family context vào localStorage để
//   `getFamilyContext`/cai-dat vẫn hoạt động như mock cũ.
// - KHÔNG import node:sqlite (client-safe); server route lo phần DB.
// ===========================================================================

import {
  AuthError,
  AUTH_MESSAGES,
  SESSION_KEY,
  persistLocalAuthState,
} from './core'
import type { AuthSession, RegisterInput, LoginInput } from './core'

function ls(): Storage | null {
  return (globalThis as { localStorage?: Storage }).localStorage ?? null
}

function readSession(): AuthSession | null {
  try {
    const raw = ls()?.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    return null
  }
}

function writeSession(s: AuthSession): void {
  ls()?.setItem(SESSION_KEY, JSON.stringify(s))
}

function clearSession(): void {
  ls()?.removeItem(SESSION_KEY)
}

interface ServerAuthData {
  session: AuthSession
  family: {
    family_id: string
    family_code: string | null
    family_name: string | null
    members: { user_id: string; name: string | null; email: string; role: 'owner' | 'member' }[]
  }
}

async function postAuth(path: 'register' | 'login', body: unknown): Promise<ServerAuthData> {
  const res = await fetch(`/api/v1/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const code = (json as { error?: { code?: string; message?: string } })?.error?.code
    const msg = (json as { error?: { message?: string } })?.error?.message ?? AUTH_MESSAGES.UNKNOWN
    throw new AuthError(code ?? 'AUTH', msg)
  }
  return (json as { data: ServerAuthData }).data
}

/** Đăng ký → session (server tạo user + family trong SQLite). */
export async function registerUser(input: RegisterInput): Promise<AuthSession> {
  const data = await postAuth('register', input)
  writeSession(data.session)
  persistLocalAuthState({
    user_id: data.session.user_id,
    email: data.session.email,
    name: data.session.name,
    family_id: data.family.family_id,
    family_name: data.family.family_name,
    family_code: data.family.family_code,
    members: data.family.members,
  })
  return data.session
}

/** Login → session (server verify trong SQLite). */
export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const data = await postAuth('login', input)
  writeSession(data.session)
  persistLocalAuthState({
    user_id: data.session.user_id,
    email: data.session.email,
    name: data.session.name,
    family_id: data.family.family_id,
    family_name: data.family.family_name,
    family_code: data.family.family_code,
    members: data.family.members,
  })
  return data.session
}

export function getSession(): AuthSession | null {
  const s = readSession()
  if (!s) return null
  if (Date.now() > s.expiresAt) {
    clearSession()
    return null
  }
  return s
}

export function logout(): void {
  const token = readSession()?.token
  clearSession()
  // Best-effort: xoá session server-side (SQLite) — không chặn UI nếu lỗi.
  if (token) {
    fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {})
  }
}
