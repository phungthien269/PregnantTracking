'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Card, Field, Input, Select } from '@mevabe/ui'
import { eddFromLmp, lmpFromEdd, lmpEddConflict, weekFromLmp } from '@/lib/pregnancy-math'

/** Đảo client của /onboarding — submit qua REST API (không nạp client data layer). */
export function OnboardingForm({ existing, currentFetuses }: { existing: boolean; currentFetuses: number }) {
  const router = useRouter()
  const [lmp, setLmp] = useState('')
  const [edd, setEdd] = useState('')
  const [fetalCount, setFetalCount] = useState('1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const computedEdd = lmp ? eddFromLmp(lmp) : ''
  const computedLmp = edd ? lmpFromEdd(edd) : ''
  const conflict = lmp && edd ? lmpEddConflict(lmp, edd) : false
  const finalLmp = lmp || computedLmp
  const week = finalLmp ? weekFromLmp(finalLmp) : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!finalLmp) return
    setSubmitting(true)
    setError(null)
    try {
      const target = Number(fetalCount)
      if (existing) {
        // Đã có thai kỳ → thêm thai cho đủ số đã chọn (đa thai mở rộng).
        for (let i = currentFetuses; i < target; i++) {
          const res = await fetch('/api/v1/fetuses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
          if (!res.ok) throw new Error('Không thêm được thai nhi — thử lại nhé.')
        }
      } else {
        const res = await fetch('/api/v1/pregnancies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lmp: finalLmp, edd: edd || null, fetalCount: target }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          throw new Error(json?.error?.message ?? 'Không tạo được hành trình — thử lại nhé.')
        }
      }
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra — thử lại nhé.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl items-center px-4 py-10">
      <Card
        className="w-full"
        title="🌸 Chào mừng mẹ đến với Mẹ & Bé"
        description="Cùng tạo hành trình thai kỳ cho cả gia đình."
      >
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">
            Nhập <strong className="text-fg">1 trong 2</strong> ngày (có thể nhập cả 2 để đối chiếu).
          </p>

          <Field label="Ngày đầu kỳ kinh cuối (LMP)" htmlFor="lmp">
            <Input id="lmp" type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} />
          </Field>
          {lmp && (
            <p className="text-xs text-muted">
              → Dự sinh ước tính: <strong className="text-fg">{computedEdd}</strong>
            </p>
          )}

          <Field label="Ngày dự sinh (EDD)" htmlFor="edd">
            <Input id="edd" type="date" value={edd} onChange={(e) => setEdd(e.target.value)} />
          </Field>
          {edd && (
            <p className="text-xs text-muted">
              → LMP ước tính: <strong className="text-fg">{computedLmp}</strong>
            </p>
          )}

          {conflict && (
            <p className="rounded-md bg-warning/10 p-3 text-sm text-warning" role="alert">
              ⚠️ LMP và EDD mâu thuẫn nhau (chênh lệch trên 2 tuần). Mẹ kiểm tra lại nhé.
            </p>
          )}

          <Field label="Số thai nhi" htmlFor="fetal">
            <Select id="fetal" value={fetalCount} onChange={(e) => setFetalCount(e.target.value)}>
              <option value="1">1 bé</option>
              <option value="2">2 bé (song thai)</option>
              <option value="3">3 bé (sinh ba)</option>
            </Select>
          </Field>

          {week && (
            <p className="text-sm text-muted">
              Tuần thai hiện tại: <strong className="text-fg">tuần {week}</strong>
            </p>
          )}

          {error && (
            <p className="rounded-md bg-danger/10 p-3 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-xs text-muted">
              {submitting ? 'Đang tạo hành trình…' : 'Hành trình được tạo dựa trên LMP/EDD của mẹ.'}
            </p>
            <Button type="submit" disabled={!finalLmp || submitting}>
              Tạo hành trình →
            </Button>
          </div>
        </form>
      </Card>
    </main>
  )
}
