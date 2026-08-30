// ===========================================================================
// email.ts — gửi email THẬT qua Resend REST API (fetch thuần — không thêm dep).
// - Có RESEND_API_KEY → gửi thật.
// - Thiếu key → trả { sent: false, reason } — engine fallback in-app, không lỗi.
// Dùng cho kênh 'email' của notification engine (collectDueNotifications).
// Server-only. Không import ở client.
// ===========================================================================

const RESEND_API = 'https://api.resend.com/emails'

export interface EmailPayload {
  to: string
  subject: string
  text: string
}

export interface EmailResult {
  sent: boolean
  reason?: string
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { sent: false, reason: 'Thiếu RESEND_API_KEY' }
  const from = process.env.RESEND_FROM ?? 'Mẹ & Bé <onboarding@resend.dev>'
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { sent: false, reason: `Resend ${res.status}: ${body.slice(0, 120)}` }
    }
    return { sent: true }
  } catch (err) {
    return { sent: false, reason: (err as Error).message }
  }
}
