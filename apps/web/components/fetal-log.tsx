'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { MOVEMENT_LABELS, MOVEMENT_OPTIONS } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Field, Select, Textarea } from '@mevabe/ui'
import type { FetalMovementFeeling, Fetus } from '@mevabe/domain'
import { fetusDisplayName, fetusKey, parseFetusNote, tagFetusNote } from '@/lib/multi-fetus'

export interface LogRow {
  id: string
  feeling: FetalMovementFeeling
  felt_at: string
  note?: string | null
}

const feelingTone = (f: FetalMovementFeeling) =>
  f === 'absent' ? ('danger' as const) : f === 'reduced' ? ('warning' as const) : f === 'strong' ? ('primary' as const) : ('neutral' as const)

export function FetalLog({ logs }: { logs: LogRow[] }) {
  const router = useRouter()
  const [feeling, setFeeling] = useState<FetalMovementFeeling>('normal')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  // Đa thai: tự nạp danh sách thai (client → /api/v1/fetuses). >1 thai → hiện bộ chọn.
  const [fetuses, setFetuses] = useState<Fetus[]>([])
  // '' = Tất cả; khác '' = key thai ('A'/'B'/'C').
  const [selectedFetus, setSelectedFetus] = useState('')

  useEffect(() => {
    let cancelled = false
    // getFetuses() trả toàn bộ thai của gia đình. Ưu tiên lọc theo thai kỳ hiện
    // tại (getPregnancy); nếu client không đọc được (route /current chỉ PATCH)
    // thì dùng toàn bộ — tránh chặn toàn bộ việc nạp danh sách thai.
    data
      .getFetuses()
      .then((fs) => {
        if (cancelled) return
        data
          .getPregnancy()
          .then((preg) => {
            if (!cancelled) setFetuses(preg ? fs.filter((f) => f.pregnancy_id === preg.id) : fs)
          })
          .catch(() => {
            if (!cancelled) setFetuses(fs)
          })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const isMulti = fetuses.length > 1
  const fetusKeySel = selectedFetus || null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const tagged = tagFetusNote(fetusKeySel, note)
      await data.addFetalMovement({ felt_at: new Date().toISOString(), feeling, note: tagged || undefined })
      setNote('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const visibleLogs = logs
    .map((l) => ({ log: l, parsed: parseFetusNote(l.note) }))
    .filter(({ parsed }) => !fetusKeySel || parsed.fetusKey === fetusKeySel)

  return (
    <div className="space-y-6">
      <Card title="Ghi nhận thai máy">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cảm nhận" htmlFor="fm-feeling">
              <Select id="fm-feeling" value={feeling} onChange={(e) => setFeeling(e.target.value as FetalMovementFeeling)}>
                {MOVEMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            {isMulti && (
              <Field label="Chọn thai" htmlFor="fm-fetus">
                <Select id="fm-fetus" value={selectedFetus} onChange={(e) => setSelectedFetus(e.target.value)}>
                  <option value="">Tất cả</option>
                  {fetuses.map((f) => (
                    <option key={f.id} value={fetusKey(f)}>
                      {fetusDisplayName(f)}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Ghi chú" htmlFor="fm-note">
              <Textarea id="fm-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: đạp lúc tối, sau ăn…" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {isMulti
                ? 'Chọn thai để ghi nhật ký cho đúng bé. Chỉ theo dõi xu hướng cá nhân; nếu thai máy giảm hẳn, liên hệ bác sĩ ngay.'
                : 'Chỉ theo dõi xu hướng cá nhân. Nếu thai máy giảm hẳn, liên hệ bác sĩ ngay.'}
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Thêm'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Nhật ký thai máy">
        {visibleLogs.length ? (
          <ul className="divide-y divide-border">
            {visibleLogs.map(({ log: l, parsed }) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={feelingTone(l.feeling)}>{MOVEMENT_LABELS[l.feeling]}</Badge>
                  {parsed.fetusKey && <Badge tone="neutral">Thai {parsed.fetusKey}</Badge>}
                  {parsed.note && <span className="text-xs text-muted">{parsed.note}</span>}
                </div>
                <span className="shrink-0 text-xs text-muted">{fmtDateTime(l.felt_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có bản ghi" description="Ghi lại cảm nhận thai máy mỗi ngày để nắm xu hướng." />
        )}
      </Card>
    </div>
  )
}
