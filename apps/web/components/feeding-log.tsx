'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import { FEEDING_METHOD_LABELS, FEEDING_METHOD_OPTIONS } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Field, Input, Select } from '@mevabe/ui'
import type { FeedingMethod } from '@mevabe/domain'

export interface FeedingRow {
  id: string
  method: FeedingMethod
  amount_ml?: number | null
  started_at: string
  note?: string | null
}

const methodTone = (m: FeedingMethod) => (m === 'breast' ? ('primary' as const) : m === 'formula' ? ('accent' as const) : ('neutral' as const))

export function FeedingLog({ logs, childId }: { logs: FeedingRow[]; childId: string }) {
  const router = useRouter()
  const [method, setMethod] = useState<FeedingMethod>('breast')
  const [amount, setAmount] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await data.addFeeding(childId, {
        method,
        amount_ml: amount ? Number(amount) : null,
        started_at: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString(),
      })
      setAmount('')
      setStartedAt('')
      router.refresh()
    } catch (err) {
      setError(isOfflineError(err) ? OFFLINE_MESSAGE : err instanceof Error && err.message ? err.message : 'Không lưu được cữ bú — mẹ thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Ghi bú">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <Field label="Hình thức" htmlFor="feed-method">
            <Select id="feed-method" value={method} onChange={(e) => setMethod(e.target.value as FeedingMethod)}>
              {FEEDING_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lượng (ml)" htmlFor="feed-amount">
            <Input id="feed-amount" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="VD: 90" />
          </Field>
          <Field label="Thời điểm" htmlFor="feed-at">
            <Input id="feed-at" type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
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

      <Card title="Nhật ký bú">
        {logs.length ? (
          <ul className="divide-y divide-border">
            {logs.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <Badge tone={methodTone(f.method)}>{FEEDING_METHOD_LABELS[f.method]}</Badge>
                  {f.amount_ml != null && <span className="ml-2 text-fg">{f.amount_ml} ml</span>}
                </div>
                <span className="shrink-0 text-xs text-muted">{fmtDateTime(f.started_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có bản ghi bú" description="Ghi mỗi cữ bú để nắm nhu cầu của bé." />
        )}
      </Card>
    </div>
  )
}
