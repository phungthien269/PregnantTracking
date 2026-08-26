'use client'

import { useEffect, useState } from 'react'
import { Badge, Card, Toggle } from '@mevabe/ui'
import { PageHeader } from '@/components/page-header'
import { data } from '@/lib/data/client-entry'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import { NOTIFICATION_GROUPS, type NotificationChannel } from '@mevabe/domain'
import { runAlertRules, type AlertSeverity, type RuleAlert } from '@/lib/ai/alert-rules'

const CHANNELS: { key: NotificationChannel; label: string }[] = [
  { key: 'in_app', label: 'Trong ứng dụng' },
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Đẩy (Push)' },
]

type ChannelMap = Record<NotificationChannel, boolean>

interface NotifItem {
  id: string
  title: string
  detail: string
  channel: NotificationChannel
  due: string
}

const DEFAULT_CHANNELS: ChannelMap = { in_app: true, email: true, push: false }

const SEVERITY_ORDER: AlertSeverity[] = ['critical', 'warning', 'info']
const SEVERITY_TONE: Record<AlertSeverity, 'danger' | 'warning' | 'primary'> = {
  critical: 'danger',
  warning: 'warning',
  info: 'primary',
}
const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: 'Khẩn',
  warning: 'Lưu ý',
  info: 'Nhắc nhở',
}

export default function ThongBaoPage() {
  const [channels, setChannels] = useState<ChannelMap>(DEFAULT_CHANNELS)
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [recent, setRecent] = useState<NotifItem[]>([])
  const [offline, setOffline] = useState(false)
  const [alerts, setAlerts] = useState<RuleAlert[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      // Cảnh báo sức khỏe — rule engine chạy trên dữ liệu thật.
      const [measurements, symptoms, fetalLogs, profile, water] = await Promise.all([
        data.getMeasurements().catch(() => []),
        data.getSymptoms().catch(() => []),
        data.getFetalMovementLogs().catch(() => []),
        data.getNutritionProfile().catch(() => null),
        data.getWaterCaffeine().catch(() => null),
      ])
      const healthAlerts = runAlertRules({
        measurements,
        symptoms,
        fetalMovementLogs: fetalLogs,
        conditions: profile?.conditions ?? [],
        water,
      }).sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
      if (alive) setAlerts(healthAlerts)

      const prefs = await data.getNotificationPreferences().catch(() => [])
      if (prefs.length) {
        // Kênh bật nếu có ≥1 nhóm bật kênh đó.
        const next: ChannelMap = { ...DEFAULT_CHANNELS }
        for (const ch of CHANNELS) next[ch.key] = prefs.some((p) => p.channel === ch.key && p.enabled)
        if (alive) setChannels(next)
      }
      const res = await fetch('/api/v1/notifications').then((r) => r.json().catch(() => null))
      if (isOfflineError(res)) {
        if (alive) setOffline(true)
        return
      }
      const list = (res?.data?.notifications ?? []) as NotifItem[]
      if (alive) {
        setOffline(false)
        setNotifications(list)
        setRecent(list.slice(0, 5))
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const toggle = (channel: NotificationChannel, enabled: boolean) => {
    setChannels((prev) => ({ ...prev, [channel]: enabled }))
    void Promise.all(
      NOTIFICATION_GROUPS.map((group) => data.setNotificationPreference({ group, channel, enabled })),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Thông báo" description="Chọn kênh nhận thông báo và đọc nhắc hôm nay." />

      <Card title="Cảnh báo sức khỏe" description="Tự động từ dữ liệu đã ghi (đo lường, triệu chứng, thai máy, tình trạng đã khai, nước & caffeine)">
        {alerts.length ? (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.ruleId} className="flex items-start gap-2 text-sm" role="alert">
                <Badge tone={SEVERITY_TONE[a.severity]}>{SEVERITY_LABEL[a.severity]}</Badge>
                <div>
                  <p className="text-fg">{a.message}</p>
                  <p className="mt-0.5 text-xs text-muted">{a.source}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Không có cảnh báo sức khỏe từ dữ liệu đã ghi.</p>
        )}
      </Card>

      <Card title="Kênh thông báo">
        <div className="space-y-3">
          {CHANNELS.map((c) => (
            <Toggle
              key={c.key}
              checked={channels[c.key]}
              onChange={(v) => toggle(c.key, v)}
              label={`${c.label} — nhận nhắc lịch khám, uống thuốc, việc cần làm`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Được lưu vào notification_preferences (mock hoặc Supabase).</p>
      </Card>

      <Card title="Bản tin sáng" description="Nhắc đến hạn hôm nay theo giờ Việt Nam">
        <ul className="space-y-2">
          {offline ? (
            <li className="text-sm text-danger" role="alert">
              {OFFLINE_MESSAGE}
            </li>
          ) : notifications.length ? (
            notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-2 text-sm text-fg">
                <Badge tone="primary">Hôm nay</Badge>
                <span>{n.title}</span>
              </li>
            ))
          ) : (
            <li className="text-sm text-muted">Không có nhắc đến hạn hôm nay.</li>
          )}
        </ul>
      </Card>

      <Card title="Gần đây">
        <ul className="divide-y divide-border">
          {recent.length ? (
            recent.map((n) => (
              <li key={n.id} className="py-2 text-sm text-muted">
                {n.title} · <span className="text-xs">{n.detail}</span>
              </li>
            ))
          ) : (
            <li className="py-2 text-sm text-muted">Chưa có thông báo nào.</li>
          )}
        </ul>
      </Card>
    </div>
  )
}
