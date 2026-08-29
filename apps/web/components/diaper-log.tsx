'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import { DIAPER_LABELS, DIAPER_OPTIONS } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Field, Input, Select } from '@mevabe/ui'
import type { DiaperType } from '@mevabe/domain'

export interface DiaperRow {
  id: string
  type: DiaperType
  changed_at: string
  note?: string | null
}

const diaperTone = (t: DiaperType) => (t === 'poo' ? ('warning' as const) : t === 'mixed' ? ('primary' as const) : ('accent' as const))

export function DiaperLog({ logs, childId }: { logs: DiaperRow[]; childId: string }) {
  const router = useRouter()
  const [type, setType] = useState<DiaperType>('pee')
  const [occurredAt, setOccurredAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await data.addDiaper(childId, {
        type,
        changed_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
      })
      setOccurredAt('')
      router.refresh()
    } catch (err) {
      setError(isOfflineError(err) ? OFFLINE_MESSAGE : err instanceof Error && err.message ? err.message : 'Không lưu được bản ghi tã — thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Ghi tã">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Loại" htmlFor="diaper-type">
            <Select id="diaper-type" value={type} onChange={(e) => setType(e.target.value as DiaperType)}>
              {DIAPER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Thời điểm" htmlFor="diaper-at">
            <Input id="diaper-at" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </Field>
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger sm:col-span-2">
              {error}
            </p>
          )}
          <div className="sm:col-span-2 sm:justify-self-end">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Đang lưu…' : 'Thêm'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Nhật ký tã">
        {logs.length ? (
          <ul className="divide-y divide-border">
            {logs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Badge tone={diaperTone(d.type)}>{DIAPER_LABELS[d.type]}</Badge>
                <span className="shrink-0 text-xs text-muted">{fmtDateTime(d.changed_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có bản ghi tã" description="Ghi lại để theo dõi nhu động ruột của bé." />
        )}
      </Card>
    </div>
  )
}
