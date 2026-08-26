import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Client Supabase. Trả null khi chưa cấu hình env → app chạy chế độ demo (mock).
 * Agent 3 (Backend data) dùng client này cho implementation supabase của DataApi.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const isSupabaseConfigured = (): boolean => Boolean(url && anonKey)
