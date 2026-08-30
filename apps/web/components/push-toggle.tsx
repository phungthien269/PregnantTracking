'use client'

import { useEffect, useState } from 'react'
import { Badge, Button, Card } from '@mevabe/ui'

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const buf = new ArrayBuffer(raw.length)
  const arr = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

type State = 'unsupported' | 'unconfigured' | 'off' | 'on' | 'pending'

/** Đảo client bật/tắt Web Push trên /thong-bao (R-notify). */
export function PushToggle() {
  const [state, setState] = useState<State>('pending')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState('unsupported')
        return
      }
      const cfg = await fetch('/api/v1/push').then((r) => r.json().catch(() => null))
      if (!cfg?.data?.configured || !cfg?.data?.publicKey) {
        setState('unconfigured')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setState(sub ? 'on' : 'off')
    })().catch(() => setState('off'))
  }, [])

  const enable = async () => {
    setMessage(null)
    try {
      const cfg = await fetch('/api/v1/push').then((r) => r.json())
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setMessage('Chưa cấp quyền thông báo — mở lại trong cài đặt trình duyệt nếu muốn bật.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.data.publicKey),
      })
      const json = sub.toJSON()
      const res = await fetch('/api/v1/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      if (!res.ok) throw new Error('Không lưu được thiết bị')
      setState('on')
      setMessage('Đã bật thông báo đẩy cho thiết bị này 🎉')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Bật thông báo đẩy chưa thành công.')
    }
  }

  const disable = async () => {
    setMessage(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/v1/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('off')
      setMessage('Đã tắt thông báo đẩy cho thiết bị này.')
    } catch {
      setMessage('Tắt chưa thành công — thử lại nhé.')
    }
  }

  return (
    <Card title="Thông báo đẩy (Push)">
      {state === 'pending' ? (
        <p className="text-sm text-muted">Đang kiểm tra…</p>
      ) : state === 'unsupported' ? (
        <p className="text-sm text-muted">Thiết bị/trình duyệt này chưa hỗ trợ thông báo đẩy.</p>
      ) : state === 'unconfigured' ? (
        <p className="text-sm text-muted">
          Chưa cấu hình máy chủ push (VAPID). Bố trí env VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY để bật.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {state === 'on' ? <Badge tone="success">Đang bật</Badge> : <Badge>Đang tắt</Badge>}
            {state === 'on' ? (
              <Button variant="ghost" size="sm" onClick={disable}>
                Tắt cho thiết bị này
              </Button>
            ) : (
              <Button size="sm" onClick={enable}>
                Bật thông báo đẩy
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">
            Nhắc lịch khám, uống thuốc, việc cần làm hiện ngay trên màn hình khóa — kể cả khi không mở app.
          </p>
          {message && (
            <p className="text-xs text-muted" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
