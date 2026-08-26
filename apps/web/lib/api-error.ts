// ===========================================================================
// api-error.ts — xử lý lỗi API /api/v1 phía client (PWA offline).
// Envelope chuẩn: { data } | { error: { code, message, details } }.
// Service worker v2 khi offline trả { error: { code: 'OFFLINE', message } } status 503
// — data-fetch layer phải hiện message thân thiện thay vì vỡ/crash.
// ===========================================================================

/** Message thân thiện hiển thị cho user khi ngoại tuyến. */
export const OFFLINE_MESSAGE = 'Bạn đang ngoại tuyến — kiểm tra kết nối và thử lại.'

interface ApiErrorBody {
  error?: { code?: string; message?: string }
}

/**
 * Đúng nếu đây là lỗi ngoại tuyến: envelope OFFLINE từ SW, hoặc
 * TypeError "Failed to fetch" (dev không có SW / Supabase chưa bị chặn).
 */
export function isOfflineError(body: unknown): boolean {
  const b = body as ApiErrorBody | null
  return (
    b?.error?.code === 'OFFLINE' ||
    (body instanceof TypeError && body.message === 'Failed to fetch')
  )
}

/**
 * Message lỗi thân thiện cho UI. Nhận envelope JSON đã parse (hoặc Error/TypeError
 * từ catch) và fallback cho trường hợp không xác định:
 * - ngoại tuyến → OFFLINE_MESSAGE
 * - envelope có error.message → message chuẩn từ server
 * - còn lại → fallback
 */
export function apiErrorMessage(body: unknown, fallback: string): string {
  if (isOfflineError(body)) return OFFLINE_MESSAGE
  return (body as ApiErrorBody | null)?.error?.message ?? fallback
}
