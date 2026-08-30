// ===========================================================================
// request-scope.server.ts — Isolation ngữ cảnh request bằng AsyncLocalStorage.
//
// Vấn đề trước đây: `requestClient` (refcount) và `active` (active user) là biến
// module-global dùng chung — 2 request song song A/B chồng nhau làm method của
// A chạy dưới client/user của B (query sai family, ghi dữ liệu sai người).
//
// Giải pháp: lib/data/index.ts bọc MỖI method call trong `als.run(store)` —
// store chứa client Supabase + snapshot active user của riêng request đó.
// supabase.ts / active-user.ts đọc qua reader-hook (không import node:* ở đây
// ngoài file này → client bundle không vỡ).
//
// SERVER-ONLY: chỉ lib/data/index.ts được import file này (node:async_hooks).
// ===========================================================================

import { AsyncLocalStorage } from 'node:async_hooks'
import type { SupabaseClient } from '@supabase/supabase-js'
import { registerActiveUserReader, getActiveUser, type ActiveUserContext } from '../auth/active-user'
import { registerRequestClientReader } from './supabase-client-hook'

export interface RequestStore {
  supabaseClient: SupabaseClient | null
  activeUser: ActiveUserContext | null
}

const als = new AsyncLocalStorage<RequestStore>()

// Đăng ký reader một lần khi module được nạp (server entry).
// Reader trả `undefined` = không có store (browser/không qua index.ts) → caller
// fallback về biến module cũ; trả `null` = có store nhưng user/client rỗng.
registerActiveUserReader(() => {
  const s = als.getStore()
  return s ? s.activeUser : undefined
})
registerRequestClientReader(() => {
  const s = als.getStore()
  return s ? s.supabaseClient : undefined
})

/** Chạy `fn` trong ngữ cảnh request cô lập (client + user snapshot riêng). */
export function runIsolated<T>(
  store: RequestStore,
  fn: () => Promise<T>,
): Promise<T> {
  return als.run(store, fn)
}

/** Ghi client vào store hiện tại (nếu có) — dùng bởi index.ts giữa chừng. */
export function setScopeClient(c: SupabaseClient | null): void {
  const s = als.getStore()
  if (s) s.supabaseClient = c
}

/**
 * Bọc một DataApi object (VD localApi SQLite): mỗi method call chạy trong store
 * riêng (user snapshot tại thời điểm gọi) → 2 request song song không giành
 * active user của nhau. Local mode không có Supabase client (null).
 */
export function wrapIsolated<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver)
      if (typeof value !== 'function') return value
      return async (...args: unknown[]): Promise<unknown> => {
        const store: RequestStore = { supabaseClient: null, activeUser: getActiveUser() }
        return runIsolated(store, () => Promise.resolve((value as (...a: unknown[]) => unknown).apply(obj, args)))
      }
    },
  }) as T
}
