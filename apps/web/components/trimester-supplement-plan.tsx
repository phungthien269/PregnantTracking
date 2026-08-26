import { Badge, Card } from '@mevabe/ui'
import { SUPPLEMENT_PLAN } from '@/lib/nutrition/supplement-plan'
import type { SupplementPlanItem, SupplementStagePlan } from '@/lib/nutrition/supplement-plan'
import { SourceList } from '@/components/nutrition-citation'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="w-20 shrink-0 text-[11px] font-medium text-muted">{label}</dt>
      <dd className="text-xs leading-snug text-fg">{value}</dd>
    </div>
  )
}

function PlanItem({ item }: { item: SupplementPlanItem }) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight text-fg">{item.name}</p>
        <Badge tone={item.essential ? 'success' : 'neutral'} className="shrink-0">
          {item.essential ? 'KHÔNG NÊN THIẾU' : 'theo nhu cầu'}
        </Badge>
      </div>
      <dl className="mt-1.5 space-y-1">
        <Row label="Liều" value={item.dose} />
        <Row label="Thời điểm" value={item.timing} />
        <Row label="Bắt đầu/dừng" value={item.startStop} />
      </dl>
      {item.interactions.length > 0 && (
        <div className="mt-2 rounded bg-warning/10 p-2">
          <p className="text-[11px] font-medium text-warning">⚠️ Tương tác</p>
          <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-muted">
            {item.interactions.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {item.askDoctor.length > 0 && (
        <div className="mt-2 rounded bg-primary-soft/40 p-2">
          <p className="text-[11px] font-medium text-primary-strong">Hỏi bác sĩ khi</p>
          <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-[11px] leading-snug text-muted">
            {item.askDoctor.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
      {item.vietnamNote && <p className="mt-2 text-[11px] leading-snug text-success">🇻🇳 {item.vietnamNote}</p>}
      <SourceList citations={item.sources} label="Nguồn" />
    </div>
  )
}

function StageCard({ stage }: { stage: SupplementStagePlan }) {
  return (
    <Card title={stage.label} description={stage.weeks} className="h-fit">
      {stage.note && <p className="mb-3 rounded-md bg-primary-soft/40 p-2 text-xs leading-snug text-muted">{stage.note}</p>}
      <div className="space-y-3">
        {stage.items.map((item) => (
          <PlanItem key={item.id} item={item} />
        ))}
      </div>
    </Card>
  )
}

/**
 * Kế hoạch bổ sung theo tam cá nguyệt — Trước thai / T1 / T2 / T3.
 * Mỗi giai đoạn liệt kê bổ sung KHÔNG NÊN THIẾU + liều + thời điểm + tương tác + nguồn.
 */
export function TrimesterSupplementPlan() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {SUPPLEMENT_PLAN.map((stage) => (
        <StageCard key={stage.stageId} stage={stage} />
      ))}
    </div>
  )
}
