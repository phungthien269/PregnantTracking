import { data } from '@/lib/data'
import { fmtDate, todayStr } from '@/lib/format'
import { Badge, Card, EmptyState } from '@mevabe/ui'
import { VaccinationForm } from '@/components/vaccination-form'
import {
  VACCINATION_SCHEDULE,
  dueDateOf,
  monthsBetween,
  scheduleDoseStatus,
  type VaccineStatus,
} from '@/lib/vaccination-schedule'

interface VaccinationRow {
  id: string
  vaccine_name: string
  dose_number: number | null
  scheduled_date: string
  administered_date?: string | null
  location?: string | null
  notes?: string | null
}

const SCHEDULE_LABEL: Record<VaccineStatus, string> = {
  done: 'Đã tiêm',
  overdue: 'Quá hạn',
  due: 'Đến hạn',
  upcoming: 'Sắp tới',
}
const SCHEDULE_TONE: Record<VaccineStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  done: 'success',
  overdue: 'danger',
  due: 'warning',
  upcoming: 'neutral',
}

export default async function ChildVaccinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [vaccinations, children] = await Promise.all([data.getVaccinations(id), data.getChildren()])
  const child = children.find((c) => c.id === id)
  const today = todayStr()

  const sorted = [...vaccinations].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
  const done = sorted.filter((v) => v.administered_date)
  const upcoming = sorted.filter((v) => !v.administered_date)

  const renderList = (list: VaccinationRow[], empty: string) =>
    list.length ? (
      <ul className="divide-y divide-border">
        {list.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div>
              <p className="text-fg">
                {v.vaccine_name}
                {v.dose_number ? ` — mũi ${v.dose_number}` : ''}
              </p>
              {(v.notes || v.location) && (
                <p className="text-xs text-muted">
                  {[v.location, v.notes].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {v.administered_date ? (
                <Badge tone="success">Đã tiêm</Badge>
              ) : v.scheduled_date < today ? (
                <Badge tone="danger">Quá hạn</Badge>
              ) : (
                <Badge tone="warning">Sắp tới</Badge>
              )}
              <span className="text-xs text-muted">{fmtDate(v.administered_date ?? v.scheduled_date)}</span>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState title={empty} />
    )

  const ageMonths = child ? monthsBetween(child.birth_date, today) : null
  const scheduleRows = child
    ? VACCINATION_SCHEDULE.map((dose) => ({
        dose,
        due: dueDateOf(child.birth_date, dose.due_month),
        status: scheduleDoseStatus(dose, {
          birthDate: child.birth_date,
          administered: done.map((v) => ({ name: v.vaccine_name, dose_number: v.dose_number })),
          today,
        }),
      })).sort((a, b) => a.dose.due_month - b.dose.due_month || a.dose.dose_number - b.dose.dose_number)
    : []

  return (
    <div className="space-y-6">
      <Card title="Thêm mũi tiêm" description="Ghi lại mũi tiêm đã thực hiện hoặc đặt lịch hẹn sắp tới.">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {child && ageMonths != null
              ? `Bé ${child.name} được ${ageMonths} tháng tuổi — mũi nào đến hạn/quá hạn sẽ đánh dấu bên dưới.`
              : 'Thêm mũi tiêm để theo dõi lịch cho bé.'}
          </p>
          <VaccinationForm childId={id} />
        </div>
      </Card>

      <Card title="Đã tiêm">{renderList(done as VaccinationRow[], 'Chưa có mũi nào đã tiêm')}</Card>

      <Card title="Sắp tới">
        {upcoming.length ? (
          <>
            {renderList(upcoming as VaccinationRow[], 'Không có mũi sắp tới')}
            {upcoming.some((v) => v.scheduled_date < today) && (
              <p className="mt-3 text-xs text-danger">
                Mũi đánh dấu &ldquo;Quá hạn&rdquo; đã qua ngày hẹn mà chưa tiêm — nên đặt lịch sớm với trạm y tế / bác sĩ.
              </p>
            )}
          </>
        ) : (
          <EmptyState title="Không có mũi sắp tới" />
        )}
      </Card>

      <Card
        title="Lịch đề xuất (0–24 tháng)"
        description={
          ageMonths != null
            ? `Bé ${ageMonths} tháng tuổi. Lịch tham khảo chuẩn quốc tế (CDC/AAP) kết hợp lịch TCMR Việt Nam — luôn theo hướng dẫn của trạm y tế / bác sĩ.`
            : 'Lịch tham khảo chuẩn quốc tế (CDC/AAP) và lịch TCMR Việt Nam.'
        }
      >
        {scheduleRows.length ? (
          <ul className="divide-y divide-border">
            {scheduleRows.map(({ dose, due, status }) => (
              <li key={dose.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="text-fg">
                    {dose.vaccine}
                    <span className="text-muted"> — mũi {dose.dose_number}</span>
                  </p>
                  <p className="text-xs text-muted">
                    Tháng thứ {dose.due_month} · hẹn khoảng {fmtDate(due)}
                  </p>
                  {(dose.note || dose.vietnamNote) && (
                    <p className="mt-0.5 text-xs text-muted">{dose.note ?? dose.vietnamNote}</p>
                  )}
                  {dose.sources.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted">
                      Nguồn:{' '}
                      {dose.sources.map((s, i) => (
                        <span key={s.url}>
                          {i > 0 && ' · '}
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            {s.org}
                          </a>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <Badge tone={SCHEDULE_TONE[status]}>{SCHEDULE_LABEL[status]}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có lịch đề xuất" />
        )}
        <p className="mt-3 text-xs text-muted">
          💉 Tài liệu giáo dục sức khỏe — không thay thế tư vấn y khoa. Mũi nào chưa xác minh nguồn sẽ không hiển thị nguồn.
        </p>
      </Card>
    </div>
  )
}
