import { data } from '@/lib/data'
import { fmtDateTime } from '@/lib/format'
import { APPOINTMENT_LABELS } from '@/lib/labels'
import { PageHeader } from '@/components/page-header'
import { Badge, Card, ProgressRing } from '@mevabe/ui'

/** Mốc thai kỳ tham khảo (tĩnh, dùng chung cho timeline). */
const MILESTONES: Record<number, string> = {
  4: 'Tim thai hình thành',
  8: 'Bé bắt đầu cử động',
  12: 'Khám lần đầu, siêu âm 12 tuần',
  16: 'Nhiều mẹ bắt đầu cảm nhận thai máy',
  20: 'Siêu âm giữa thai kỳ',
  24: 'Phổi đang phát triển',
  28: 'Bước vào tam cá nguyệt thứ ba',
  32: 'Khám tháng thứ 8',
  36: 'Chuẩn bị đồ đi sinh',
  40: 'Dự sinh',
}

export default async function TimelinePage() {
  const [dash, appointments] = await Promise.all([data.getDashboard(), data.getAppointments()])
  const pct = (dash.week / 40) * 100

  return (
    <div className="space-y-6">
      <PageHeader title="Hành trình thai kỳ" description="Các tuần + mốc phát triển + lịch khám của mẹ." />

      <section className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5 shadow-card">
        <div>
          <p className="text-sm text-muted">Tiến trình</p>
          <p className="mt-1 text-2xl font-semibold text-fg">
            Tuần {dash.week} / 40
          </p>
          <p className="mt-1 text-sm text-muted">Còn {dash.daysLeft} ngày nữa tới dự sinh</p>
        </div>
        <ProgressRing value={pct} size={88} label={`Tiến trình ${Math.round(pct)}%`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Timeline các tuần">
          <ol className="relative space-y-3 border-l border-border pl-4">
            {Array.from({ length: dash.week }, (_, i) => i + 1).map((w) => {
              const isCurrent = w === dash.week
              const marker = MILESTONES[w]
              return (
                <li key={w} className="relative">
                  <span
                    className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${
                      isCurrent ? 'bg-primary' : 'bg-border'
                    }`}
                    aria-hidden
                  />
                  <p className="text-sm font-medium text-fg">
                    Tuần {w}
                    {isCurrent && <Badge className="ml-2" tone="primary">Hiện tại</Badge>}
                  </p>
                  {marker && <p className="text-xs text-muted">{marker}</p>}
                </li>
              )
            })}
          </ol>
        </Card>

        <Card title="Lịch khám">
          {appointments.length ? (
            <ul className="divide-y divide-border">
              {[...appointments]
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                .map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="text-fg">{APPOINTMENT_LABELS[a.type]}</span>
                    <span className="shrink-0 text-xs text-muted">{fmtDateTime(a.scheduled_at)}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Chưa có lịch khám nào.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'
