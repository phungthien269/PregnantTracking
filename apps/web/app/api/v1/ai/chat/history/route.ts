import { apiOk } from '@/lib/api-utils'
import { chatStore } from '@/lib/ai/chat-store'

// GET /api/v1/ai/chat/history — lịch sử hội thoại của user đang đăng nhập.
//   Không tham số → trả danh sách phiên (mới nhất trước).
//   ?sessionId=<uuid> → trả thêm tin nhắn của phiên đó (đã resolve nguồn hiển thị).
// Chưa đăng nhập / mock không có phiên → trả mảng rỗng (UI hiện cuộc trò chuyện mới).
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')

  const [sessions, messages] = await Promise.all([
    chatStore.listSessions().catch(() => []),
    sessionId ? chatStore.listMessages(sessionId).catch(() => []) : Promise.resolve([]),
  ])

  return apiOk({ sessions, messages })
}
