'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { todayStr } from '@/lib/format'
import { Button, Field, Input } from '@mevabe/ui'

/** Form thêm 1 điểm tăng trưởng — cân nặng/chiều cao/vòng đầu (tùy chọn). */
export function GrowthForm({ childId }: { childId: string }) {
  const router = useRouter()
  const [date, setDate] = useState(todayStr())
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [head, setHead] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return
    if (!weight && !height && !head) {
      setError('Nhập ít nhất một chỉ số (cân nặng / chiều cao / vòng đầu).')
      return
    }
    setError('')
    setSaving(true)
    try {
      await data.addGrowthPoint(childId, {
        date,
        weightKg: weight ? Number(weight) : undefined,
        heightCm: height ? Number(height) : undefined,
        headCm: head ? Number(head) : undefined,
      })
      setWeight('')
      setHeight('')
      setHead('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được số đo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Ngày đo" htmlFor="g-date">
        <Input id="g-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      <Field label="Cân nặng (kg)" htmlFor="g-weight" hint="Tùy chọn">
        <Input
          id="g-weight"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="VD 6.2"
        />
      </Field>
      <Field label="Chiều cao (cm)" htmlFor="g-height" hint="Tùy chọn">
        <Input
          id="g-height"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          placeholder="VD 64"
        />
      </Field>
      <Field label="Vòng đầu (cm)" htmlFor="g-head" hint="Tùy chọn">
        <Input
          id="g-head"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={head}
          onChange={(e) => setHead(e.target.value)}
          placeholder="VD 41"
        />
      </Field>
      <div className="flex items-end">
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Đang lưu…' : 'Thêm số đo'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-danger sm:col-span-2 lg:col-span-5" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
