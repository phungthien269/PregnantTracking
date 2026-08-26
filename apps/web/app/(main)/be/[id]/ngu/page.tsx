import { data } from '@/lib/data'
import { SleepLog } from '@/components/sleep-log'

export default async function ChildSleepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const logs = await data.getSleeps(id)
  return (
    <div>
      <p className="mb-4 text-sm text-muted">Nhật ký giấc ngủ của bé.</p>
      <SleepLog logs={logs} childId={id} />
    </div>
  )
}
