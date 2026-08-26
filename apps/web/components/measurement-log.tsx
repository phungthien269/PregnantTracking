'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { data, type MeasurementInput } from '@/lib/data/client-entry'
import { MEASUREMENT_LABELS, MEASUREMENT_OPTIONS, MEASUREMENT_UNITS } from '@/lib/labels'
import { fmtDayMonth, fmtDateTime } from '@/lib/format'
import { Button, Card, EmptyState, Field, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@mevabe/ui'
import { LineChart } from './line-chart'
import type { MeasurementType } from '@mevabe/domain'

export interface MeasurementRow {
  id: string
  type: MeasurementType
  value: number
  unit: string
  taken_at: string
  note?: string | null
}

export function MeasurementLog({ measurements }: { measurements: MeasurementRow[] }) {
  const router = useRouter()
  const [type, setType] = useState<MeasurementType>('weight')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState(MEASUREMENT_UNITS.weight)
  const [note, setNote] = useState('')
  const [takenAt, setTakenAt] = useState('')
  const [saving, setSaving] = useState(false)

  const types = useMemo(() => {
    const present = measurements.map((m) => m.type)
    return [...new Set<MeasurementType>([type, ...present])]
  }, [measurements, type])

  const rows = measurements.filter((m) => m.type === type)
  const points = rows.map((m) => ({ label: fmtDayMonth(m.taken_at), value: m.value }))

  const onTypeChange = (t: MeasurementType) => {
    setType(t)
    setUnit(MEASUREMENT_UNITS[t])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = Number(value)
    if (!Number.isFinite(v)) return
    const input: MeasurementInput = {
      type,
      value: v,
      unit: unit.trim() || MEASUREMENT_UNITS[type],
      taken_at: takenAt ? new Date(takenAt).toISOString() : new Date().toISOString(),
      note: note.trim() || undefined,
    }
    setSaving(true)
    try {
      await data.addMeasurement(input)
      setValue('')
      setNote('')
      setTakenAt('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Thêm lần đo" description="Cân nặng, huyết áp, đường huyết…">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Loại" htmlFor="m-type">
            <select
              id="m-type"
              value={type}
              onChange={(e) => onTypeChange(e.target.value as MeasurementType)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MEASUREMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Giá trị (${MEASUREMENT_UNITS[type] || '—'})`} htmlFor="m-value">
            <Input id="m-value" type="number" step="any" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="VD: 62.5" />
          </Field>
          <Field label="Thời điểm đo" htmlFor="m-at">
            <Input id="m-at" type="datetime-local" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
          </Field>
          <Field label="Ghi chú" htmlFor="m-note">
            <Input id="m-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: sau bữa ăn" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4 lg:col-start-4 lg:justify-self-end">
            <Button type="submit" disabled={!value || saving} className="w-full lg:w-auto">
              {saving ? 'Đang lưu…' : 'Thêm'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Nhật ký đo lường">
        <Tabs defaultValue={type}>
          <TabsList>
            {types.map((t) => (
              <TabsTrigger key={t} value={t}>
                {MEASUREMENT_LABELS[t]}
              </TabsTrigger>
            ))}
          </TabsList>
          {types.map((t) => (
            <TabsContent key={t} value={t}>
              {rows.length ? (
                <div className="space-y-4">
                  <LineChart data={points} yUnit={` ${MEASUREMENT_UNITS[t]}`.trim()} />
                  <ul className="divide-y divide-border">
                    {rows.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="text-fg">
                          {m.value} {m.unit}
                          {m.note && <span className="ml-2 text-xs text-muted">— {m.note}</span>}
                        </span>
                        <span className="shrink-0 text-xs text-muted">{fmtDateTime(m.taken_at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyState title="Chưa có số đo" description="Thêm lần đo đầu tiên bằng form phía trên." />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  )
}
