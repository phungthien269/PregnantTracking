// ===========================================================================
// supabase-server.ts — client Supabase cho phía MÁY CHỦ (server component,
// route handler, server action). Đọc access_token từ cookie `sb_token`
// (ghi bởi lib/auth/supabase.ts sau login/register) để tạo client đã xác thực.
//
// KHÔNG import từ lib/data/* hay lib/auth/* — module này server-only
// (dùng next/headers), không được kéo vào client bundle.
// ===========================================================================

import { cookies } from 'next/headers'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const AUTH_COOKIE = 'sb_token'

/** Tên cookie lưu access token (đồng bộ với lib/auth/supabase.ts). */
export const AUTH_COOKIE_NAME = AUTH_COOKIE

/**
 * Client Supabase đã xác thực theo cookie phiên. Trả null khi:
 *   - chưa cấu hình env, hoặc
 *   - chưa có cookie (chưa đăng nhập).
 * Client tạo mới mỗi lần gọi (không singleton) để không giữ token máy chủ.
 */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  if (!url || !anonKey) return null
  let cookieStore: Awaited<ReturnType<typeof cookies>>
  try {
    cookieStore = await cookies()
  } catch {
    // Ngoài request scope (build/SSG) → không có phiên → trả null (không crash build).
    return null
  }
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${decodeURIComponent(token)}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
