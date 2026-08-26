'use client'

// ===========================================================================
// WeekPicker — section "Thông tin thai kỳ" trong /cai-dat.
// - Hiển thị tuần hiện tại + EDD (props `initial` từ server component).
// - Chọn tuần 1–42 bằng slider → EDD = anchor + (40−N)×7, LMP = EDD − 280.
// - Hoặc nhập trực tiếp LMP / EDD (tính chéo nhau bằng Naegele; EDD để trống → tự tính).
// - Lưu qua PATCH /api/v1/pregnancies/current → router.refresh() để dashboard
//   (server component) đọc tuần mới từ data layer.
// ===========================================================================
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, Field, Input, buttonClasses } from '@mevabe/ui'
import type { Trimester } from '@mevabe/domain'
import { TRIMESTER_LABELS } from '@/lib/labels'
import { apiErrorMessage } from '@/lib/api-error'
import { fmtDate } from '@/lib/format'
import { eddFromLmp, lmpFromEdd } from '@/lib/pregnancy-math'
import { anchorFromDashboard, eddForWeek, lmpForWeek, MAX_WEEK, trimesterOf } from '@/lib/week'

export interface WeekPickerInitial {
  week: number
  trimester: Trimester
  /** yyyy-MM-dd */
  dueDate: string
  lmp: string | null
  edd: string | null
}

export function WeekPicker({ initial }: { initial: WeekPickerInitial }) {
  const router = useRouter()
  // Mốc 'hôm nay' mà dashboard dùng để suy tuần (mock: TODAY cố định).
  const anchor = useMemo(
    () => anchorFromDashboard(initial.dueDate, initial.week),
    [initial.dueDate, initial.week],
  )

  const [mode, setMode] = useState<'week' | 'manual'>('week')
  const [week, setWeek] = useState(initial.week)
  const [lmp, setLmp] = useState(initial.lmp ?? '')
  const [edd, setEdd] = useState(initial.edd ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const weekEdd = eddForWeek(week, anchor)
  const weekLmp = lmpForWeek(week, anchor)
  const canSave = mode === 'week' || Boolean(lmp || edd)

  const switchMode = (m: 'week' | 'manual') => {
    if (m === 'manual' && mode === 'week') {
      setLmp(weekLmp)
      setEdd(weekEdd)
    }
    setMode(m)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const payload =
        mode === 'week'
          ? { lmp: weekLmp, edd: weekEdd }
          : { lmp: lmp || undefined, edd: edd || undefined }
      if (!payload.lmp && !payload.edd) throw new Error('Cần nhập LMP hoặc EDD')
      const res = await fetch('/api/v1/pregnancies/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw body
      setSaved(true)
      // Làm server components (dashboard, hero tuần) đọc tuần mới từ data layer.
      router.refresh()
    } catch (err) {
      setError(apiErrorMessage(err, 'Không thể lưu tuần thai. Vui lòng thử lại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title="Thông tin thai kỳ"
      description="Sửa ngày đầu kỳ kinh cuối (LMP) và ngày dự sinh (EDD) — tuần thai và các gợi ý sẽ tự cập nhật."
    >
      <div className="space-y-4">
        {/* Trạng thái hiện tại */}
        <p className="text-sm text-muted">
          Hiện tại: <strong className="text-fg">Tuần {initial.week}</strong> · EDD{' '}
          <strong className="text-fg">{fmtDate(initial.dueDate)}</strong>{' '}
          <Badge tone="primary">{TRIMESTER_LABELS[initial.trimester]}</Badge>
        </p>

        {/* Chế độ chọn */}
        <div className="flex gap-2" role="group" aria-label="Cách chọn tuần thai">
          <button
            type="button"
            aria-pressed={mode === 'week'}
            onClick={() => switchMode('week')}
            className={buttonClasses(mode === 'week' ? 'primary' : 'secondary', 'sm')}
          >
            Chọn tuần
          </button>
          <button
            type="button"
            aria-pressed={mode === 'manual'}
            onClick={() => switchMode('manual')}
            className={buttonClasses(mode === 'manual' ? 'primary' : 'secondary', 'sm')}
          >
            Nhập LMP/EDD
          </button>
        </div>

        {mode === 'week' ? (
          <div className="space-y-2">
            <label htmlFor="week-slider" className="text-sm font-medium text-fg">
              Tuần thai
            </label>
            <input
              id="week-slider"
              type="range"
              min={1}
              max={MAX_WEEK}
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              style={{ accentColor: 'var(--mv-primary)' }}
            />
            <div className="flex justify-between text-xs text-muted">
              <span>Tuần 1</span>
              <span>Tuần {MAX_WEEK}</span>
            </div>
            <p className="text-sm text-fg">
              Tuần <strong>{week}</strong> · {TRIMESTER_LABELS[trimesterOf(week)]}
            </p>
            <p className="text-xs text-muted">
              EDD: <strong className="text-fg">{fmtDate(weekEdd)}</strong> · LMP:{' '}
              <strong className="text-fg">{fmtDate(weekLmp)}</strong>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Field label="Ngày đầu kỳ kinh cuối (LMP)" htmlFor="wlmp">
                <Input id="wlmp" type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
              </Field>
              <Button
                variant="secondary"
                size="sm"
                disabled={!lmp}
                onClick={() => lmp && setEdd(eddFromLmp(lmp))}
              >
                Tính từ LMP
              </Button>
            </div>
            <div className="space-y-1.5">
              <Field label="Ngày dự sinh (EDD)" htmlFor="wedd">
                <Input id="wedd" type="date" value={edd} onChange={(e) => setEdd(e.target.value)} />
              </Field>
              <Button
                variant="secondary"
                size="sm"
                disabled={!edd}
                onClick={() => edd && setLmp(lmpFromEdd(edd))}
              >
                Tính từ EDD
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-danger/10 p-2.5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-md bg-success/10 p-2.5 text-sm text-success" role="status">
            Đã lưu thông tin thai kỳ — tuần thai và các gợi ý sẽ tự cập nhật.
          </p>
        )}

        <div className="flex items-center justify-end">
          <Button onClick={save} disabled={saving || !canSave}>
            {saving ? 'Đang lưu…' : 'Lưu tuần thai'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
