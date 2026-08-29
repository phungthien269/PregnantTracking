import { data } from '@/lib/data'
import { FeedingLog } from '@/components/feeding-log'

export default async function ChildFeedingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const logs = await data.getFeedings(id)
  return (
    <div>
      <p className="mb-4 text-sm text-muted">Nhật ký bú của bé — theo dõi nhu cầu và nhịp ăn.</p>
      <FeedingLog logs={logs} childId={id} />
    </div>
  )
}
