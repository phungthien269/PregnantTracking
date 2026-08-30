// ===========================================================================
// supabase-client-hook.ts — hook pattern để supabase.ts đọc client ngữ cảnh
// request mà KHÔNG import node:async_hooks (file này không import node:* →
// client bundle an toàn; bản thân hàm hook mặc định trả undefined).
// request-scope.server.ts (server-only) đăng ký reader thật lúc khởi động.
// ===========================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

export type RequestClientReader = () => SupabaseClient | null | undefined

let reader: RequestClientReader | null = null

/** Gọi bởi request-scope.server.ts (server) — không gọi chỗ khác. */
export function registerRequestClientReader(r: RequestClientReader): void {
  reader = r
}

/**
 * undefined = không có ngữ cảnh request (browser) → fallback singleton.
 * null = đang trong store nhưng chưa gắn client.
 */
export function readRequestClient(): SupabaseClient | null | undefined {
  return reader ? reader() : undefined
}
