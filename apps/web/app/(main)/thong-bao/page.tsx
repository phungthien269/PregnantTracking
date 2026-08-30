import { Badge, Card } from '@mevabe/ui'
import { PageHeader } from '@/components/page-header'
import { CHANNELS, NotificationChannels, type ChannelMap } from '@/components/notification-channels'
import { PushToggle } from '@/components/push-toggle'
import { data } from '@/lib/data'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import type { NotificationChannel } from '@mevabe/domain'
import { runAlertRules, type AlertSeverity, type RuleAlert } from '@/lib/ai/alert-rules'
import { runDueNotifications } from '@/lib/inngest/engine'

export const dynamic = 'force-dynamic'

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

interface NotifItem {
  id: string
  title: string
  detail: string
  channel: NotificationChannel
  due: string
}

/**
 * /thong-bao — R8 (perf): server fetch + chạy rule engine NGAY TRÊN MÁY CHỦ
 * (trước đây client nạp cả data layer + chạy 5 lượt gọi song song rồi mới render).
 * Đảo client duy nhất: 3 công tắc kênh.
 */
export default async function ThongBaoPage() {
  const [measurements, symptoms, fetalLogs, profile, water, prefs, due] = await Promise.all([
    data.getMeasurements().catch(() => []),
    data.getSymptoms().catch(() => []),
    data.getFetalMovementLogs().catch(() => []),
    data.getNutritionProfile().catch(() => null),
    data.getWaterCaffeine().catch(() => null),
    data.getNotificationPreferences().catch(() => []),
    runDueNotifications().catch(() => []),
  ])

  const alerts: RuleAlert[] = runAlertRules({
    measurements,
    symptoms,
    fetalMovementLogs: fetalLogs,
    conditions: profile?.conditions ?? [],
    water,
  }).sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))

  const channels: ChannelMap = { ...DEFAULT_CHANNELS }
  if (prefs.length) {
    for (const ch of CHANNELS) channels[ch.key] = prefs.some((p) => p.channel === ch.key && p.enabled)
  }

  const offline = isOfflineError(due)
  const notifications = offline ? [] : (due as { notifications?: NotifItem[] })?.notifications ?? []
  const recent = notifications.slice(0, 5)

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

      <NotificationChannels initial={channels} />

      <PushToggle />

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
