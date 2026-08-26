import { Badge, Card } from '@mevabe/ui'
import type { NutrientReference } from '@/lib/nutrition'
import { SourceList } from '@/components/nutrition-citation'

const TRIMESTERS = ['T1', 'T2', 'T3'] as const

/**
 * Thẻ chi tiết một vi chất: nhu cầu T1/T2/T3 (highlight tam cá nguyệt hiện tại),
 * dải bổ sung an toàn, UL, nguồn thực phẩm Việt, tác động lên mẹ & thai, trích dẫn.
 */
export function NutrientRecommendationCard({
  reference,
  trimester,
  vietnamNote,
}: {
  reference: NutrientReference
  trimester: (typeof TRIMESTERS)[number]
  /** Ghi chú khuyến nghị VN (VD vitamin D 800 IU, canxi 1.200 mg) nếu khác chuẩn quốc tế. */
  vietnamNote?: string
}) {
  const isVitaminA = reference.id === 'vitamin_a'

  const rangeDisplay =
    reference.supplementRange.min !== null && reference.supplementRange.max !== null
      ? `${reference.supplementRange.min}–${reference.supplementRange.max} ${reference.unit}`
      : reference.supplementRange.min !== null
        ? `≥${reference.supplementRange.min} ${reference.unit}`
        : reference.supplementRange.max !== null
          ? `≤${reference.supplementRange.max} ${reference.unit}`
          : null

  return (
    <Card title={reference.name} description={reference.unit}>
      <div className="space-y-3">
        {isVitaminA && (
          <div className="rounded-md bg-warning/10 p-3">
            <Badge tone="danger">⚠️ Cảnh báo thừa</Badge>
            <p className="mt-1 text-[11px] leading-snug text-muted">
              Không tự ý bổ sung retinol — xem chi tiết dưới đây.
            </p>
          </div>
        )}

        {vietnamNote && (
          <div className="rounded-md bg-accent-soft/40 p-3">
            <p className="text-xs font-medium text-success">{vietnamNote}</p>
          </div>
        )}

        {/* Nhu cầu theo 3 tam cá nguyệt */}
        <div className="rounded-md bg-surface-muted p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Nhu cầu hằng ngày
          </p>
          <ul className="mt-1 space-y-1 text-xs">
            {TRIMESTERS.map((t) => (
              <li key={t} className={t === trimester ? 'font-medium text-fg' : 'text-muted'}>
                <span className="inline-block w-7 shrink-0 font-semibold">{t}</span>
                {reference.needs[t].display}
              </li>
            ))}
          </ul>
        </div>

        {reference.weekNotes && <p className="text-xs leading-relaxed text-muted">{reference.weekNotes}</p>}

        {/* Dải bổ sung an toàn */}
        {rangeDisplay && (
          <div className="rounded-md bg-accent-soft/40 p-3">
            <p className="text-xs font-medium text-success">
              Bổ sung an toàn: {rangeDisplay}/ngày
            </p>
            {reference.supplementRangeNote && (
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{reference.supplementRangeNote}</p>
            )}
          </div>
        )}

        {/* UL / giới hạn trên */}
        {reference.ul !== null ? (
          <div className="rounded-md bg-warning/10 p-3">
            <p className="text-xs font-medium text-warning">
              Giới hạn trên (UL): {reference.ul} {reference.unit}/ngày
            </p>
            {reference.ulNote && <p className="mt-0.5 text-[11px] leading-snug text-muted">{reference.ulNote}</p>}
          </div>
        ) : (
          reference.ulNote && <p className="text-[11px] leading-snug text-muted">{reference.ulNote}</p>
        )}

        {/* Nguồn thực phẩm Việt */}
        <div>
          <p className="text-xs font-medium text-muted">Thực phẩm giàu</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {reference.foodSources.map((f) => (
              <span
                key={f}
                className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-success"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Tác động */}
        <div className="grid gap-2 text-xs text-muted sm:grid-cols-2">
          <p>
            <span className="font-medium text-fg">Thai nhi:</span> {reference.impactFetus}
          </p>
          <p>
            <span className="font-medium text-fg">Mẹ:</span> {reference.impactMother}
          </p>
        </div>

        <SourceList citations={reference.citations} />
      </div>
    </Card>
  )
}
