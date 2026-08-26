'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { data } from '@/lib/data/client-entry'
import { Button, Card, Field, Input, Select } from '@mevabe/ui'
import { eddFromLmp, lmpFromEdd, lmpEddConflict, weekFromLmp } from '@/lib/pregnancy-math'

export default function OnboardingPage() {
  const router = useRouter()
  const [lmp, setLmp] = useState('')
  const [edd, setEdd] = useState('')
  const [fetalCount, setFetalCount] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  const computedEdd = lmp ? eddFromLmp(lmp) : ''
  const computedLmp = edd ? lmpFromEdd(edd) : ''
  const conflict = lmp && edd ? lmpEddConflict(lmp, edd) : false
  const finalLmp = lmp || computedLmp
  const week = finalLmp ? weekFromLmp(finalLmp) : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!finalLmp) return
    setSubmitting(true)
    try {
      const target = Number(fetalCount)
      // Đã có thai kỳ → thêm thai cho đủ số đã chọn (đa thai mở rộng).
      // Client getPregnancy có thể chưa có GET /pregnancies/current (chỉ PATCH)
      // → lỗi thì bỏ qua, tạo mới như luồng cũ.
      let existing: { id: string } | null = null
      try {
        existing = await data.getPregnancy()
      } catch {
        existing = null
      }
      if (existing) {
        const current = (await data.getFetuses()).filter((f) => f.pregnancy_id === existing.id).length
        for (let i = current; i < target; i++) {
          await data.addFetus({})
        }
      } else {
        await data.startPregnancy({ lmp: finalLmp, edd: edd || null, fetalCount: target })
      }
      router.push('/dashboard')
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
