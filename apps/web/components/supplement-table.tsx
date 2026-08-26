import { Card } from '@mevabe/ui'
import type { SupplementRecommendation } from '@/lib/nutrition'
import { SourceList } from '@/components/nutrition-citation'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="w-24 shrink-0 text-xs font-medium text-muted">{label}</dt>
      <dd className="text-sm text-fg">{value}</dd>
    </div>
  )
}

/** Danh sách khuyến nghị bổ sung: liều, thời điểm, giai đoạn, khi nào cần bác sĩ, cảnh báo thừa, nguồn. */
export function SupplementTable({ recommendations }: { recommendations: SupplementRecommendation[] }) {
  return (
    <div className="space-y-4">
      {recommendations.map((r) => (
        <Card key={r.id} title={r.name}>
          <dl className="space-y-1.5">
            <Row label="Liều khuyến nghị" value={r.dose} />
            <Row label="Thời điểm" value={r.timing} />
            <Row label="Giai đoạn" value={r.stage} />
          </dl>
          {r.doctorNeeded.length > 0 && (
            <div className="mt-3 rounded-md bg-primary-soft/40 p-3">
              <p className="text-xs font-medium text-primary-strong">Khi nào cần bác sĩ</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-muted">
                {r.doctorNeeded.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
          {r.excessWarning && (
            <div className="mt-3 rounded-md bg-warning/10 p-3">
              <p className="text-xs font-medium text-warning">⚠️ Cảnh báo thừa / quá liều</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{r.excessWarning}</p>
            </div>
          )}
          <SourceList citations={r.citations} />
        </Card>
      ))}
    </div>
  )
}
