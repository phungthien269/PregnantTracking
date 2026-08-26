import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ===========================================================================
// Middleware /api/v1 — bảo mật cơ bản: rate-limit (in-memory) + origin check.
//
// PERMISSIVE: chỉ chặn khi vượt ngưỡng CAO (30/60/120 req/phút) → không gây
// lỗi giả cho các agent đang thêm route song song (meals/ocr/health-sync/
// quiz-report — tất cả đều nằm trong matcher /api/v1 nhưng ngưỡng đủ rộng).
//
// `ponytail:` rate-limit in-memory (Map) — chuẩn cho 1 instance (dev/demo).
// Khi deploy nhiều instance (Vercel edge) cần store chia sẻ (Upstash/Redis)
// — xem orchestration/docs/security-audit.md.
// ===========================================================================

const WINDOW_MS = 60_000
const LIMITS = {
  ai: 30, // /api/v1/ai/* — gọi AI tốn tiền, ngưỡng thấp hơn
  mutation: 60, // POST/PATCH/DELETE /api/v1/*
  read: 120, // GET/HEAD còn lại
} as const

type BucketKey = keyof typeof LIMITS
const buckets = new Map<string, { count: number; resetAt: number }>()

/** Chọn bucket theo path + method; trả null nếu không cần rate-limit. */
function bucketFor(path: string, method: string): BucketKey | null {
  if (path.startsWith('/api/v1/ai/')) return 'ai'
  if (method === 'GET' || method === 'HEAD') return 'read'
  return 'mutation'
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  const first = fwd?.split(',')[0]?.trim()
  if (first) return first
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/** Dọn entry hết hạn — chỉ quét khi Map lớn để không tốn chi phí mỗi request. */
function sweep(): void {
  if (buckets.size < 1000) return
  const now = Date.now()
  for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k)
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const res = NextResponse.next()

  // 1) Origin check cho mutation (CSRF rẻ — không cần token vì chưa có cookie
  //    auth; khi nối auth cookie thật phải thêm double-submit token — xem report).
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.get('origin')
    if (origin) {
      try {
        const host = req.headers.get('host') ?? ''
        if (new URL(origin).host !== host) {
          return NextResponse.json(
            { error: { code: 'CSRF_ORIGIN', message: 'Origin không khớp — từ chối' } },
            { status: 403 },
          )
        }
      } catch {
        return NextResponse.json(
          { error: { code: 'CSRF_ORIGIN', message: 'Origin không hợp lệ' } },
          { status: 403 },
        )
      }
    }
  }

  // 2) Rate-limit (bỏ qua GET /api/v1/ai/chat?format=... đã ở bucket read).
  const bucket = bucketFor(pathname, req.method)
  if (bucket) {
    sweep()
    const now = Date.now()
    const key = `${clientIp(req)}:${bucket}`
    let rec = buckets.get(key)
    if (!rec || rec.resetAt <= now) {
      rec = { count: 0, resetAt: now + WINDOW_MS }
      buckets.set(key, rec)
    }
    rec.count += 1
    const limit = LIMITS[bucket]
    const remaining = Math.max(0, limit - rec.count)
    res.headers.set('X-RateLimit-Limit', String(limit))
    res.headers.set('X-RateLimit-Remaining', String(remaining))
    if (rec.count > limit) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Quá nhiều yêu cầu — thử lại sau 1 phút',
            details: { limit, bucket },
          },
        },
        { status: 429, headers: { 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' } },
      )
    }
  }

  return res
}

export const config = {
  matcher: ['/api/v1/:path*'],
}
