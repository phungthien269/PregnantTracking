'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiErrorMessage } from '@/lib/api-error'
import type { SymptomReportInput } from '@/lib/data/client-entry'
import { SEVERITY_LABELS, SEVERITY_OPTIONS } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Field, Input, Select, Textarea, Toggle } from '@mevabe/ui'
import { SymptomAnalyzer } from './symptom-analyzer'
import type { SymptomSeverity } from '@mevabe/domain'

export interface SymptomRow {
  id: string
  symptom: string
  severity: SymptomSeverity
  started_at: string
  note?: string | null
}

const severityTone = (s: SymptomSeverity) =>
  s === 'severe' ? ('danger' as const) : s === 'moderate' ? ('warning' as const) : ('neutral' as const)

export function SymptomLog({ symptoms }: { symptoms: SymptomRow[] }) {
  const router = useRouter()
  const [symptom, setSymptom] = useState('')
  const [severity, setSeverity] = useState<SymptomSeverity>('mild')
  const [note, setNote] = useState('')
  const [privateOnly, setPrivateOnly] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!symptom.trim()) return
    const input: SymptomReportInput = {
      symptom: symptom.trim(),
      severity,
      started_at: new Date().toISOString(),
      note: note.trim() || undefined,
      private: privateOnly,
    }
    setSaving(true)
    setError('')
    try {
      // Ghi qua API route (server-side) — tránh split-brain mock: client
      // data.addSymptom không persist sang module server → refresh không thấy.
      const res = await fetch('/api/v1/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      setSymptom('')
      setNote('')
      setPrivateOnly(false)
      router.refresh()
    } catch (err) {
      setError(apiErrorMessage(err, 'Không lưu được triệu chứng — mẹ thử lại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Ghi nhận triệu chứng">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Triệu chứng" htmlFor="sym-name">
              <Input id="sym-name" value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="VD: ốm nghén, đau lưng…" />
            </Field>
            <Field label="Mức độ" htmlFor="sym-sev">
              <Select id="sym-sev" value={severity} onChange={(e) => setSeverity(e.target.value as SymptomSeverity)}>
                {SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Ghi chú" htmlFor="sym-note">
            <Textarea id="sym-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: sau khi ăn, buổi sáng…" />
          </Field>
          <Toggle checked={privateOnly} onChange={setPrivateOnly} label="Chỉ mình tôi xem" />
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SymptomAnalyzer />
            <Button type="submit" disabled={!symptom.trim() || saving}>
              {saving ? 'Đang lưu…' : 'Thêm'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Nhật ký triệu chứng">
        {symptoms.length ? (
          <ul className="divide-y divide-border">
            {symptoms.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="text-fg">{s.symptom}</p>
                  {s.note && <p className="text-xs text-muted">{s.note}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={severityTone(s.severity)}>{SEVERITY_LABELS[s.severity]}</Badge>
                  <span className="text-xs text-muted">{fmtDateTime(s.started_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có triệu chứng" description="Ghi nhận để theo dõi cùng bác sĩ khi khám." />
        )}
      </Card>
    </div>
  )
}
