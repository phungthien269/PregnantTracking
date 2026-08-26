'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { Button, Field, Input, Select } from '@mevabe/ui'
import type { MilestoneStatus } from '@mevabe/domain'

export function MilestoneForm({ childId }: { childId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<MilestoneStatus>('achieved')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await data.addMilestone(childId, { name: name.trim(), status })
      setName('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
      <Field label="Cột mốc" htmlFor="ms-name">
        <Input id="ms-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Lẫy lần đầu" />
      </Field>
      <Field label="Trạng thái" htmlFor="ms-status">
        <Select id="ms-status" value={status} onChange={(e) => setStatus(e.target.value as MilestoneStatus)}>
          <option value="achieved">Đạt</option>
          <option value="not_yet">Chưa</option>
          <option value="questionable">Cần theo dõi</option>
        </Select>
      </Field>
      <div className="flex items-end">
        <Button type="submit" disabled={!name.trim() || saving} className="w-full sm:w-auto">
          {saving ? 'Đang lưu…' : 'Thêm'}
        </Button>
      </div>
    </form>
  )
}
