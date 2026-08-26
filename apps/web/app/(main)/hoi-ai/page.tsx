import { PageHeader } from '@/components/page-header'
import { ChatUI } from '@/components/chat-ui'
import { chatStore } from '@/lib/ai/chat-store'

export default async function HoiAiPage() {
  // Lịch sử hội thoại của user (server-side, RLS lọc theo user) — mở phiên mới nhất.
  const sessions = await chatStore.listSessions().catch(() => [])
  const activeSessionId = sessions[0]?.id ?? null
  const messages = activeSessionId ? await chatStore.listMessages(activeSessionId).catch(() => []) : []

  return (
    <div className="space-y-6">
      <PageHeader title="Hỏi AI" description="Trò chuyện dựa trên nội dung thư viện của mẹ." />
      <ChatUI initialSessions={sessions} initialSessionId={activeSessionId} initialMessages={messages} />
    </div>
  )
}
export const dynamic = 'force-dynamic'
