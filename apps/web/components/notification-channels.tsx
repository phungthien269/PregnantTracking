'use client'

import { useState } from 'react'
import { Card, Toggle } from '@mevabe/ui'
import { data } from '@/lib/data/client-entry'
import { NOTIFICATION_GROUPS, type NotificationChannel } from '@mevabe/domain'

export const CHANNELS: { key: NotificationChannel; label: string }[] = [
  { key: 'in_app', label: 'Trong ứng dụng' },
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Đẩy (Push)' },
]

export type ChannelMap = Record<NotificationChannel, boolean>

/** Đảo client duy nhất của /thong-bao: 3 công tắc kênh + lưu preference. */
export function NotificationChannels({ initial }: { initial: ChannelMap }) {
  const [channels, setChannels] = useState<ChannelMap>(initial)

  const toggle = (channel: NotificationChannel, enabled: boolean) => {
    setChannels((prev) => ({ ...prev, [channel]: enabled }))
    void Promise.all(
      NOTIFICATION_GROUPS.map((group) => data.setNotificationPreference({ group, channel, enabled })),
    )
  }

  return (
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
  )
}
