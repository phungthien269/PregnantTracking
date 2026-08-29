'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import { SLEEP_PLACE_LABELS, SLEEP_PLACE_OPTIONS } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Field, Input, Select } from '@mevabe/ui'
import type { SleepPlace } from '@mevabe/domain'

export interface SleepRow {
  id: string
  started_at: string
  ended_at?: string | null
  place?: SleepPlace | null
  note?: string | null
}

export function SleepLog({ logs, childId }: { logs: SleepRow[]; childId: string }) {
  const router = useRouter()
  const [place, setPlace] = useState<SleepPlace>('cot')
  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await data.addSleep(childId, {
        place,
        started_at: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString(),
        ended_at: endedAt ? new Date(endedAt).toISOString() : null,
      })
      setStartedAt('')
      setEndedAt('')
      router.refresh()
    } catch (err) {
      setError(isOfflineError(err) ? OFFLINE_MESSAGE : err instanceof Error && err.message ? err.message : 'Không lưu được giấc ngủ — thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Ghi giấc ngủ">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <Field label="Vị trí ngủ" htmlFor="sleep-place">
            <Select id="sleep-place" value={place} onChange={(e) => setPlace(e.target.value as SleepPlace)}>
              {SLEEP_PLACE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Bắt đầu" htmlFor="sleep-start">
            <Input id="sleep-start" type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
          </Field>
          <Field label="Kết thúc" htmlFor="sleep-end">
            <Input id="sleep-end" type="datetime-local" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} />
          </Field>
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger sm:col-span-3">
              {error}
            </p>
          )}
          <div className="sm:col-span-3 sm:justify-self-end">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Đang lưu…' : 'Thêm'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Nhật ký ngủ">
        {logs.length ? (
          <ul className="divide-y divide-border">
            {logs.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  {s.place && <Badge tone="accent">{SLEEP_PLACE_LABELS[s.place]}</Badge>}
                  <span className="ml-2 text-fg">
                    {fmtDateTime(s.started_at)}
                    {s.ended_at ? ` → ${fmtDateTime(s.ended_at)}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có bản ghi ngủ" description="Ghi giấc ngủ để nhận biết nhịp sinh học của bé." />
        )}
      </Card>
    </div>
  )
}
