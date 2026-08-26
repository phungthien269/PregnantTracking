import { data } from '@/lib/data'
import { SUPPLEMENT_STATUS_LABELS } from '@/lib/labels'
import { PageHeader } from '@/components/page-header'
import { Badge, Card, EmptyState } from '@mevabe/ui'
import type { SupplementStatus } from '@mevabe/domain'
import { SUPPLEMENT_RECOMMENDATIONS } from '@/lib/nutrition'
import { SupplementTable } from '@/components/supplement-table'
import { SectionTabs, DINH_DUONG_TABS } from '@/components/section-tabs'
import { TrimesterSupplementPlan } from '@/components/trimester-supplement-plan'

interface SupplementRow {
  id: string
  name: string
  status: SupplementStatus
  notes?: string | null
}

const statusTone = (s: SupplementStatus) =>
  s === 'taken' ? ('success' as const) : s === 'skipped' ? ('neutral' as const) : s === 'confirmed' ? ('primary' as const) : ('warning' as const)

export default async function BoSungPage() {
  const supplements = await data.getSupplements()
  return (
    <div className="space-y-6">
      <SectionTabs tabs={DINH_DUONG_TABS} />
      <PageHeader
        title="Bổ sung"
        description="Danh sách bổ sung đã xác nhận + khuyến nghị vi chất theo chuẩn quốc tế (có nguồn trích dẫn)."
      />

      <Card title="Danh sách bổ sung">
        {supplements.length ? (
          <ul className="divide-y divide-border">
            {supplements.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p className="text-fg">{s.name}</p>
                  {s.notes && <p className="text-xs text-muted">{s.notes}</p>}
                </div>
                <Badge tone={statusTone(s.status)}>{SUPPLEMENT_STATUS_LABELS[s.status]}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có danh sách bổ sung" description="Bác sĩ sẽ kê đơn khi cần — chỉ uống theo chỉ định." />
        )}
      </Card>

      <div className="space-y-4">
        <div>
          <h2 className="mb-1 text-sm font-semibold text-fg">Kế hoạch bổ sung theo tam cá nguyệt</h2>
          <p className="mb-3 text-sm text-muted">
            Giai đoạn nào dùng chất gì, liều, thời điểm, tương tác — theo chuẩn quốc tế (ACOG/NIH/WHO) + hướng dẫn Việt Nam (RDA 2016 / QĐ 776).
          </p>
        </div>
        <TrimesterSupplementPlan />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-fg">
          Khuyến nghị bổ sung theo chuẩn quốc tế
        </h2>
        <SupplementTable recommendations={SUPPLEMENT_RECOMMENDATIONS} />
      </div>

      <p className="text-sm text-muted">
        💊 Chỉ dùng vi chất khi có chỉ định từ bác sĩ hoặc dược sĩ. Không tự ý tăng liều.
      </p>
    </div>
  )
}
export const dynamic = 'force-dynamic'
