'use client'

// Phần client của trang /cai-dat (Giao diện, Quyền riêng tư, Trợ lý AI, Dữ liệu).
// Tách khỏi page.tsx để page là server component — chỗ đó fetch data layer
// và truyền `initial` cho WeekPicker (tuần thai luôn đọc từ server).
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ACCENTS, Badge, buttonClasses, Button, Card, Toggle } from '@mevabe/ui'
import { useTheme } from '@/components/theme-provider'
import { useSession } from '@/lib/auth/session-context'
import { getFamilyContext, type FamilyContext } from '@/lib/auth'
import { apiErrorMessage } from '@/lib/api-error'

const MODE_LABELS: Record<string, string> = { light: 'Sáng', dark: 'Tối', system: 'Theo hệ thống' }

export function CaiDatClient() {
  const { mode, setMode, accent, setAccent } = useTheme()
  const { session, logout } = useSession()
  const router = useRouter()
  const [aiOn, setAiOn] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Gia đình (Phase 4B): đọc trực tiếp auth mock (localStorage) — chính xác và
  // không phụ thuộc thứ tự sync active user giữa các effect.
  const [family, setFamily] = useState<FamilyContext | null>(null)
  // Cấu hình AI thật từ GET /api/v1/ai/chat — không hardcode "demo-mock".
  const [aiMeta, setAiMeta] = useState({ configured: false, model: 'demo-mock', provider: 'mock' })

  useEffect(() => {
    if (!session?.user_id) {
      setFamily(null)
      return
    }
    setFamily(getFamilyContext(session.user_id))
  }, [session])

  useEffect(() => {
    fetch('/api/v1/ai/chat')
      .then((r) => r.json())
      .then((j) => {
        if (j?.data) setAiMeta(j.data)
      })
      .catch(() => {})
  }, [])

  const doExport = (kind: 'pdf' | 'csv') => {
    setExporting(kind)
    if (kind === 'pdf') window.open('/api/v1/export?format=pdf', '_blank')
    else window.location.href = '/api/v1/export?format=csv'
    window.setTimeout(() => setExporting(null), 800)
  }

  const doDelete = async () => {
    try {
      const res = await fetch('/api/v1/export', { method: 'POST' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw body
      setConfirmDelete(false)
      window.location.reload()
    } catch (err) {
      window.alert(apiErrorMessage(err, 'Không thể xóa dữ liệu lúc này. Vui lòng thử lại.'))
    }
  }

  // Chuyển tài khoản: đăng xuất → về trang đăng nhập (chọn Mẹ/Bố hoặc tài khoản khác).
  const doSwitchAccount = async () => {
    await logout()
    router.replace('/dang-nhap')
  }

  return (
    <>
      <Card title="Giao diện" description="Chế độ sáng/tối và màu chủ đạo.">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-fg">Chế độ</p>
            <div className="mt-2 flex gap-2">
              {(['light', 'dark', 'system'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={buttonClasses(mode === m ? 'primary' : 'secondary', 'sm')}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-fg">Màu chủ đạo</p>
            <div className="mt-2 flex gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccent(a)}
                  aria-label={`Màu ${a}`}
                  aria-pressed={accent === a}
                  className="relative h-9 w-9 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{ background: 'var(--mv-primary)' }}
                >
                  {accent === a && (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-bg">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Gia đình" description="Người dùng chung dữ liệu gia đình với mẹ (chế độ demo).">
        <div className="space-y-3">
          {family && family.members.length > 0 ? (
            <ul className="divide-y divide-border">
              {family.members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-fg">{m.name ?? m.email}</p>
                    <p className="truncate text-xs text-muted">{m.email}</p>
                  </div>
                  <Badge tone={m.role === 'owner' ? 'primary' : 'neutral'}>
                    {m.role === 'owner' ? 'Chủ gia đình' : 'Thành viên'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Chưa có thông tin gia đình.</p>
          )}

          {family?.family_code && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <p className="text-sm text-muted">Mã mời gia đình:</p>
              <code className="rounded bg-surface-muted px-2 py-0.5 text-sm font-semibold tracking-wide text-fg">
                {family.family_code}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(family.family_code ?? '').catch(() => {})
                }}
              >
                Sao chép
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <p className="text-xs text-muted">(chế độ demo — khi nối Supabase chuyển tài khoản thật)</p>
            <Button variant="secondary" size="sm" onClick={doSwitchAccount}>
              Đổi tài khoản
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Quyền riêng tư">
        <p className="text-sm text-muted">
          Mục đánh dấu <strong className="text-fg">"Chỉ mình tôi"</strong> (như triệu chứng, thai máy,
          tài liệu) chỉ người tạo xem được; thành viên khác trong gia đình không thấy. Mục dùng chung
          thì mọi thành viên đều thấy.
        </p>
        <p className="mt-2 text-xs text-muted">Chọn "Chỉ mình tôi" ngay trên từng biểu mẫu khi ghi dữ liệu.</p>
      </Card>

      <Card title="Trợ lý AI" description="Hỏi AI dùng nội dung trong thư viện của bạn.">
        <div className="space-y-3">
          <Toggle checked={aiOn} onChange={setAiOn} label="Bật Hỏi AI" />
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone={aiOn ? (aiMeta.configured ? 'success' : 'neutral') : 'neutral'}>
              {!aiOn ? 'Đã tắt' : aiMeta.configured ? 'AI thật' : 'Chưa cấu hình key'}
            </Badge>
            {aiMeta.configured ? (
              <>
                Model: <code className="text-fg">{aiMeta.model}</code> · Provider: <code className="text-fg">{aiMeta.provider}</code>
              </>
            ) : (
              <>Dùng fallback: <code className="text-fg">mock/nguồn</code></>
            )}
          </p>
          <p className="text-xs text-muted">
            Không gửi tên, email hay số điện thoại vào prompt. Chỉ dùng nội dung có trong thư viện.
          </p>
        </div>
      </Card>

      <Card title="Dữ liệu của mẹ">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => doExport('pdf')} disabled={exporting !== null}>
            {exporting === 'pdf' ? 'Đang xuất…' : 'Xuất PDF'}
          </Button>
          <Button variant="secondary" onClick={() => doExport('csv')} disabled={exporting !== null}>
            {exporting === 'csv' ? 'Đang xuất…' : 'Xuất CSV'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">Xuất CSV/PDF và xóa dữ liệu qua <code className="text-fg">/api/v1/export</code>.</p>
        <div className="mt-5 border-t border-border pt-4">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted">Chắc chắn xóa toàn bộ dữ liệu? Không thể hoàn tác.</p>
              <Button variant="danger" size="sm" onClick={doDelete}>
                Xóa dữ liệu
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Hủy
              </Button>
            </div>
          ) : (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Xóa dữ liệu
            </Button>
          )}
        </div>
      </Card>
    </>
  )
}
