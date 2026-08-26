import type { NextConfig } from 'next'

// ===========================================================================
// Security headers (Agent security/phase3). CSP cân bằng: đủ cho Next.js App
// Router, next/font, ảnh upload Supabase, AI fetch — KHÔNG làm hỏng web hiện tại.
// `unsafe-inline`/`unsafe-eval` trong script-src là trade-off của Next.js
// (inline hydration script + webpack runtime). Nâng cấp sau: nonce-based CSP
// khi có auth thật — xem orchestration/docs/security-audit.md.
// ===========================================================================
const CSP = [
  "default-src 'self'",
  // script: Next.js cần inline hydration + eval (dev/HMR + webpack runtime).
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // style: Tailwind/style-in-js inject inline; Google Fonts CSS (next/font).
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // font: next/font self-host, giữ gstatic phòng fallback runtime.
  "font-src 'self' data: https://fonts.gstatic.com",
  // img: data: cho icon/avatar inline; blob: cho ảnh client-side;
  // *.supabase.co cho ảnh bữa ăn / OCR upload (Supabase Storage).
  "img-src 'self' data: blob: https://*.supabase.co",
  // connect: API cùng origin; OpenRouter (fetch phía server, giữ cho chắc);
  // supabase (browser client + realtime); wss cho realtime/websocket.
  "connect-src 'self' https://openrouter.ai https://*.supabase.co wss:",
  // frame: không cho nhúng app vào iframe khác.
  "frame-ancestors 'none'",
  "frame-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  transpilePackages: ['@mevabe/ui', '@mevabe/domain'],
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
