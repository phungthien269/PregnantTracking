import type { DataApi } from './api'

// ===========================================================================
// Resolver DataApi — entry SERVER-SIDE (route handler + server component).
//   - có env Supabase  → supabaseApi (backend thật), gắn client theo cookie
//     phiên (`sb_token`) mỗi lần gọi method để server component/route handler
//     đọc đúng dữ liệu của user đang đăng nhập (xem lib/supabase-server.ts).
//   - không có env     → localApi (SQLite file, server-side)
// Client component dùng `@/lib/data/client-entry` (không kéo node:sqlite).
//
// Lazy-load: `./local` (kéo node:sqlite) và `./supabase` được dynamic import —
// module thật chỉ nạp ở lần gọi method đầu tiên. Ở production (Supabase mode)
// node:sqlite không bao giờ bị evaluate/bundle vào route/server chạy thật.
// ===========================================================================

export type { DataApi } from './api'
export * from './api'

import { isSupabaseConfigured } from '@/lib/supabase'

export const dataMode: 'supabase' | 'local' = isSupabaseConfigured() ? 'supabase' : 'local'

let resolvedApi: DataApi | null = null
let resolving: Promise<DataApi> | null = null

/**
 * Bọc supabaseApi bằng Proxy: trước mỗi method → tạo client đã xác thực từ
 * cookie phiên (server), gắn vào request scope, sau đó gọi method thật và dọn
 * dẹp. Các method nội bộ gọi nhau (this.*) vẫn thấy client vì được gắn ở module
 * trong suốt lời gọi ngoài cùng. Dynamic import `./supabase` + supabase-server.
 */
async function createServerDataApi(): Promise<DataApi> {
  const [{ supabaseApi, setRequestSupabaseClient }, { getServerSupabase }] = await Promise.all([
    import('./supabase'),
    import('@/lib/supabase-server'),
  ])
  const target = supabaseApi
  return new Proxy(target, {
    get(obj, prop, receiver) {
      const value = Reflect.get(obj, prop, receiver)
      if (typeof value !== 'function') return value
      return async (...args: unknown[]) => {
        const serverClient = await getServerSupabase()
        setRequestSupabaseClient(serverClient)
        try {
          return await (value as (...a: unknown[]) => unknown).apply(obj, args)
        } finally {
          setRequestSupabaseClient(null)
        }
      }
    },
  }) as DataApi
}

/** Resolve module thật theo mode — memoize (chạy 1 lần / tiến trình). */
function resolveApi(): Promise<DataApi> {
  if (resolvedApi) return Promise.resolve(resolvedApi)
  if (!resolving) {
    const load =
      dataMode === 'supabase'
        ? createServerDataApi()
        : import('./local').then((m) => m.localApi)
    resolving = load.then((api) => {
      resolvedApi = api
      return api
    })
  }
  return resolving
}

/**
 * Proxy mỏng — giữ chữ ký export sync (`data`) để không vỡ consumer. Mọi method
 * DataApi đều async → mỗi lần truy cập property trả async fn; module thật chỉ
 * được resolve ở lần gọi method đầu tiên.
 */
export const data: DataApi = new Proxy({} as DataApi, {
  get(_target, prop) {
    return async (...args: unknown[]) => {
      const api = await resolveApi()
      const fn = Reflect.get(api, prop, api) as (...a: unknown[]) => unknown
      return fn.apply(api, args)
    }
  },
}) as DataApi
