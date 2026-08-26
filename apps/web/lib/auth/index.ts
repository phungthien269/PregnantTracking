// ===========================================================================
// Auth — điểm vào chung. Chọn backend theo cấu hình:
//   - có Supabase env  → supabase.auth (signUp/signInWithPassword/signOut)
//   - không có env     → local (SQLite qua /api/v1/auth/register|login), session
//                        token vẫn localStorage (Phase 5).
// Không phá mock khi thiếu env; seed demo vẫn trong SQLite.
// ===========================================================================

import { isSupabaseConfigured } from '@/lib/supabase'
import * as local from './local'
import * as mock from './core'
import {
  supabaseRegister,
  supabaseLogin,
  supabaseGetSession,
  supabaseLogout,
} from './supabase'

export * from './core'

const useSupabase = isSupabaseConfigured()

/** Đăng ký → session (local) hoặc null (supabase cần xác nhận email). */
export async function registerUser(input: mock.RegisterInput): Promise<mock.AuthSession | null> {
  return useSupabase ? supabaseRegister(input) : local.registerUser(input)
}

export async function loginUser(input: mock.LoginInput): Promise<mock.AuthSession> {
  return useSupabase ? supabaseLogin(input) : local.loginUser(input)
}

export async function getSession(): Promise<mock.AuthSession | null> {
  return useSupabase ? supabaseGetSession() : local.getSession()
}

export async function logout(): Promise<void> {
  if (useSupabase) await supabaseLogout()
  local.logout()
}

/** Route guard: trả session còn hạn hoặc null (chưa đăng nhập → redirect). */
export const requireSession = getSession
