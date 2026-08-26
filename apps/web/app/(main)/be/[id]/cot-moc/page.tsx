import { data } from '@/lib/data'
import { MILESTONE_LABELS } from '@/lib/labels'
import { Badge, Card, EmptyState } from '@mevabe/ui'
import { MilestoneForm } from '@/components/milestone-form'
import type { MilestoneStatus } from '@mevabe/domain'

interface MilestoneRow {
  id: string
  name: string
  stage?: string | null
  status: MilestoneStatus
  note?: string | null
}

const milestoneTone = (s: MilestoneStatus) =>
  s === 'achieved' ? ('success' as const) : s === 'questionable' ? ('warning' as const) : ('neutral' as const)

export default async function ChildMilestonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const milestones = await data.getMilestones(id)

  const byStage = milestones.reduce<Record<string, MilestoneRow[]>>((acc, m) => {
    const key = m.stage ?? 'Chung'
    ;(acc[key] ??= []).push(m as MilestoneRow)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <Card title="Cập nhật cột mốc" description="Ghi lại khi bé đạt mốc mới.">
        <MilestoneForm childId={id} />
      </Card>
      <Card title="Cột mốc phát triển" description="Theo dõi theo giai đoạn — mỗi bé có nhịp riêng, đừng lo lắng quá.">
        {Object.keys(byStage).length ? (
          <div className="space-y-6">
            {Object.entries(byStage).map(([stage, rows]) => (
              <div key={stage}>
                <p className="text-sm font-semibold text-fg">{stage}</p>
                <ul className="mt-2 divide-y divide-border">
                  {rows.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div>
                        <p className="text-fg">{m.name}</p>
                        {m.note && <p className="text-xs text-muted">{m.note}</p>}
                      </div>
                      <Badge tone={milestoneTone(m.status)}>{MILESTONE_LABELS[m.status]}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có cột mốc" description="Cập nhật khi bé đạt mốc mới bằng form phía trên." />
        )}
      </Card>
    </div>
  )
}
