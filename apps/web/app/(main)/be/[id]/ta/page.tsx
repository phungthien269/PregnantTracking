import { data } from '@/lib/data'
import { DiaperLog } from '@/components/diaper-log'

export default async function ChildDiaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const logs = await data.getDiapers(id)
  return (
    <div>
      <p className="mb-4 text-sm text-muted">Nhật ký tã của bé.</p>
      <DiaperLog logs={logs} childId={id} />
    </div>
  )
}
