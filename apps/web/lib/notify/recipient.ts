// ===========================================================================
// recipient.ts — resolve EMAIL của người dùng hiện tại cho kênh email.
// - Supabase: auth.getUser() qua client request (cookie sb_token).
// - Local: bảng users (SQLite) theo active user.
// Server-only. Trả null khi không xác định được (engine bỏ qua email).
// ===========================================================================

import { isSupabaseConfigured } from '@/lib/supabase'
import { getServerSupabase } from '@/lib/supabase-server'
import { getActiveUser } from '@/lib/auth/active-user'
import { dbUserById } from '@/lib/db/local'

export async function currentUserEmail(): Promise<string | null> {
  if (isSupabaseConfigured()) {
    const client = await getServerSupabase()
    if (!client) return null
    const {
      data: { user },
    } = await client.auth.getUser()
    return user?.email ?? null
  }
  const au = getActiveUser()
  if (!au) return null
  return dbUserById(au.user_id)?.email ?? null
}
