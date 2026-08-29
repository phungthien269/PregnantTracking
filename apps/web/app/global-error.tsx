'use client'

import { useEffect } from 'react'
import { buttonClasses } from '@mevabe/ui'

/**
 * Error boundary CẤP ROOT — bắt cả lỗi bung từ root layout (app/error.tsx
 * không bắt được). Khi active, file này THAY THẾ root layout nên phải tự
 * render <html>/<body>; style inline tối giản để đọc được kể cả khi CSS
 * (tokens) chưa kịp tải.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="vi" suppressHydrationWarning>
      <body style={{ background: '#faf7f4', color: '#2b2320', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '32px', margin: 0 }} aria-hidden>
            😔
          </p>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Ứng dụng gặp lỗi hệ thống</h1>
          <p style={{ maxWidth: '28rem', fontSize: '14px', opacity: 0.75, margin: 0 }}>
            Rất mong mẹ thông cảm — đã có lỗi ngoài dự kiến. Nhấn “Tải lại” để vào lại ứng dụng; dữ liệu đã lưu vẫn an toàn.
          </p>
          <button className={buttonClasses()} onClick={reset}>
            Tải lại
          </button>
        </div>
      </body>
    </html>
  )
}
