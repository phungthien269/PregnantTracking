// ===========================================================================
// Client entry — DataApi cho CLIENT COMPONENT (browser).
// KHÔNG import `lib/data/local` hay `lib/db/local` (node:sqlite chỉ server-side).
// Client dùng `clientApi` (proxy fetch → /api/v1) hoặc `supabaseApi` (nếu có env).
// Server page / route handler dùng `@/lib/data` (entry server-side).
// ===========================================================================

export * from './api'
import type { DataApi } from './api'

import { clientApi } from './client'
import { supabaseApi } from './supabase'
import { isSupabaseConfigured } from '@/lib/supabase'

export const data: DataApi = isSupabaseConfigured() ? supabaseApi : clientApi
export const dataMode: 'supabase' | 'local' = isSupabaseConfigured() ? 'supabase' : 'local'
