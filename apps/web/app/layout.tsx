import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import '@mevabe/ui/tokens.css'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/lib/auth/session-context'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--mv-font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mẹ & Bé',
  description: 'Đồng hành thai kỳ, dinh dưỡng và chăm sóc bé cho gia đình Việt',
  applicationName: 'Mẹ & Bé',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf7f4' },
    { media: '(prefers-color-scheme: dark)', color: '#1f1a17' },
  ],
  // Hiển thị PWA standalone khi cài đặt.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Chống FOUC theme: đặt class dark + accent TRƯỚC hydrate, khớp chính xác
            cách ThemeProvider lưu (mv-theme/mv-accent trong localStorage). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=['light','dark','system'],a=['rose','green','blue','purple','amber'];var t=localStorage.getItem('mv-theme');t=m.indexOf(t)>=0?t:'system';var ac=localStorage.getItem('mv-accent');ac=a.indexOf(ac)>=0?ac:'rose';var r=document.documentElement;var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',dark);r.dataset.accent=ac;}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${beVietnamPro.variable} min-h-dvh`}>
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
        {/* PWA: đăng ký service worker bản production (tránh phá HMR khi dev).
            Manifest được Next tự link khi có app/manifest.ts. */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Reload chỉ khi SW mới thay quyền điều khiển (tránh reload thừa ở lần truy cập đầu).
    const hadController = !!navigator.serviceWorker.controller
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      })
      .catch(() => {})
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || refreshing) return
      refreshing = true
      window.location.reload()
    })
  })
}`,
            }}
          />
        )}
      </body>
    </html>
  )
}
