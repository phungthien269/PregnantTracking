import type { DataApi } from './api'
import { cache } from 'react'

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
/**
 * R3 (perf): memoize PER-REQUEST các read nóng — cùng request gọi 2 lần (page +
 * component con) chỉ tính 1 lần, cắt bớt roundtrip Supabase / query SQLite lặp.
 * Chỉ áp cho getter đọc thuần; mutation và getHomeBundle (tự gộp) đi đường thường.
 * cache() của React: phạm vi 1 request → dữ liệu user vẫn tươi ở request sau.
 */
const HOT_READS = new Set([
  'getPregnancy',
  'getDashboard',
  'getFetuses',
  'getWaterCaffeine',
  'getMeasurements',
  'getSymptoms',
  'getAppointments',
  'getChildren',
  'getNutritionProfile',
  'getMealsByDate',
])

const memoCache = new Map<string, ReturnType<typeof cache>>()

export const data: DataApi = new Proxy({} as DataApi, {
  get(_target, prop) {
    return async (...args: unknown[]) => {
      const api = await resolveApi()
      const fn = Reflect.get(api, prop, api) as (...a: unknown[]) => unknown
      // Method optional (vd getHomeBundle) chưa implement ở mode hiện tại → báo lỗi
      // RÕ RÀNG thay vì "undefined.apply" khó hiểu. Caller nên try/catch + fallback.
      if (typeof fn !== 'function') {
        throw new Error(`[data] Method ${String(prop)} chưa được implement ở chế độ dữ liệu hiện tại`)
      }
      if (typeof prop === 'string' && HOT_READS.has(prop)) {
        let memo = memoCache.get(prop)
        if (!memo) {
          memo = cache((...a: unknown[]) => fn.apply(api, a))
          memoCache.set(prop, memo)
        }
        return (memo as (...a: unknown[]) => unknown)(...args)
      }
      return fn.apply(api, args)
    }
  },
}) as DataApi
