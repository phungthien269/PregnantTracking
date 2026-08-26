import { notFound } from 'next/navigation'
import { data } from '@/lib/data'
import { fmtDayMonth, todayStr } from '@/lib/format'
import { Card, EmptyState } from '@mevabe/ui'
import { GrowthForm } from '@/components/growth-form'
import { GrowthChart, type GrowthChartPoint } from '@/components/growth-chart'
import { ageInMonths, buildGrowthView, PCT_LABEL, referenceAt } from '@/lib/growth-percentile'
import type { Gender } from '@mevabe/domain'

function refSeries(
  points: ReturnType<typeof buildGrowthView>['points'],
  measure: 'weight' | 'height' | 'head',
  sex: Gender,
): GrowthChartPoint[] {
  return points.flatMap((p) => {
    const m = p[measure]
    if (!m) return []
    return [
      {
        label: fmtDayMonth(p.date),
        value: m.value,
        p3: referenceAt(sex, measure, p.month, 3),
        p97: referenceAt(sex, measure, p.month, 97),
      },
    ]
  })
}

export default async function ChildGrowthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [children, growth] = await Promise.all([data.getChildren(), data.getGrowth(id)])
  const child = children.find((c) => c.id === id)
  if (!child) notFound()

  const view = buildGrowthView(child, growth)
  const currentMonth = ageInMonths(child.birth_date, todayStr())
  const weightSeries = refSeries(view.points, 'weight', child.sex)
  const heightSeries = refSeries(view.points, 'height', child.sex)
  const headSeries = refSeries(view.points, 'head', child.sex)
  const knownSex = child.sex !== 'unknown'

  const cell = (value: number | null | undefined, suffix: string, pct?: string | null) =>
    value != null ? `${value} ${suffix}${pct ? ' · ' + (PCT_LABEL[pct] ?? pct) : ''}` : '—'

  return (
    <div className="space-y-6">
      <Card
        title="Thêm số đo"
        description={`Bé ${child.name} ${currentMonth} tháng tuổi — ghi lại cân nặng, chiều cao, vòng đầu định kỳ.`}
      >
        <GrowthForm childId={id} />
      </Card>

      {view.warnings.length > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-4">
          <p className="font-semibold text-warning">Lưu ý tăng trưởng — nên trao đổi bác sĩ / trạm y tế</p>
          <p className="mt-1 text-sm text-muted">Thông tin mang tính tham khảo, không thay thế chẩn đoán y khoa.</p>
          <ul className="mt-2 space-y-1 text-sm text-fg">
            {view.warnings.map((w, i) => (
              <li key={i}>
                • {fmtDayMonth(w.date)} (tháng {w.month}):{' '}
                {w.measure === 'weight' ? 'Cân nặng' : w.measure === 'height' ? 'Chiều cao' : 'Vòng đầu'} — {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card
        title="Cân nặng (kg)"
        description={knownSex ? 'Đường nền chấm chấm: P3 và P97 theo chuẩn WHO.' : 'Chưa xác định giới tính — tạm bỏ đường chuẩn WHO.'}
      >
        {weightSeries.length ? (
          <GrowthChart data={weightSeries} yUnit=" kg" color="var(--mv-primary)" />
        ) : (
          <EmptyState title="Chưa có số liệu cân nặng" />
        )}
      </Card>

      <Card
        title="Chiều dài (cm)"
        description={knownSex ? 'Đường nền chấm chấm: P3 và P97 theo chuẩn WHO.' : 'Chưa xác định giới tính — tạm bỏ đường chuẩn WHO.'}
      >
        {heightSeries.length ? (
          <GrowthChart data={heightSeries} yUnit=" cm" color="var(--mv-accent)" />
        ) : (
          <EmptyState title="Chưa có số liệu chiều dài" />
        )}
      </Card>

      <Card
        title="Vòng đầu (cm)"
        description={knownSex ? 'Đường nền chấm chấm: P3 và P97 theo chuẩn WHO.' : 'Chưa xác định giới tính — tạm bỏ đường chuẩn WHO.'}
      >
        {headSeries.length ? (
          <GrowthChart data={headSeries} yUnit=" cm" color="var(--mv-warning)" />
        ) : (
          <EmptyState title="Chưa có số liệu vòng đầu" />
        )}
      </Card>

      <Card title="Bảng số đo" description="Mỗi chỉ số kèm đường percentile WHO (nếu có).">
        {view.points.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 pr-4 font-medium">Ngày</th>
                  <th className="py-2 pr-4 font-medium">Tháng tuổi</th>
                  <th className="py-2 pr-4 font-medium">Cân nặng</th>
                  <th className="py-2 pr-4 font-medium">Chiều cao</th>
                  <th className="py-2 font-medium">Vòng đầu</th>
                </tr>
              </thead>
              <tbody>
                {[...view.points].reverse().map((p, i) => (
                  <tr key={`${p.date}-${i}`} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4">{fmtDayMonth(p.date)}</td>
                    <td className="py-2 pr-4">{p.month} tháng</td>
                    <td className="py-2 pr-4">{cell(p.weightKg, 'kg', p.weight?.pct)}</td>
                    <td className="py-2 pr-4">{cell(p.heightCm, 'cm', p.height?.pct)}</td>
                    <td className="py-2">{cell(p.headCm, 'cm', p.head?.pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Chưa có số đo" description="Dùng form phía trên để ghi số đo đầu tiên." />
        )}
      </Card>

      <p className="text-sm text-muted">
        So sánh với biểu đồ tăng trưởng chuẩn khi khám để có đánh giá đúng. Ứng dụng không tự chẩn đoán.
      </p>
    </div>
  )
}
