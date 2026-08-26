import { notFound } from 'next/navigation'
import { data } from '@/lib/data'
import { TRIMESTER_LABELS } from '@/lib/labels'
import { WeekNav } from '@/components/week-nav'
import { Badge, Card, cx } from '@mevabe/ui'
import { fetusDisplayName, genderLabel } from '@/lib/multi-fetus'
import { SectionTabs, THAI_KY_TABS } from '@/components/section-tabs'
import { getWeekGuide, type Citation } from '@/lib/weekly-guides'

function Sources({ sources, className }: { sources: Citation[]; className?: string }) {
  if (!sources.length) return null
  return (
    <div className={cx('mt-3 border-t border-border pt-2', className)}>
      <p className="text-xs font-medium text-muted">Nguồn:</p>
      <ul className="mt-1 space-y-0.5">
        {sources.map((s, i) => (
          <li key={i} className="text-xs text-muted">
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              {s.org} — {s.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function WeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: weekStr } = await params
  const week = Number(weekStr)
  if (!Number.isInteger(week) || week < 1 || week > 42) notFound()

  const guide = getWeekGuide(week)
  if (!guide) notFound()

  const [info, fetuses, preg] = await Promise.all([data.getWeekInfo(week), data.getFetuses(), data.getPregnancy()])
  // getFetuses() trả toàn bộ thai của gia đình → lọc theo thai kỳ đang theo dõi.
  const activeFetuses = preg ? fetuses.filter((f) => f.pregnancy_id === preg.id) : fetuses
  const isMulti = activeFetuses.length > 1

  // Kích thước ưu tiên từ hướng dẫn tuần (cùng nguồn tham khảo với bảng tuần của app),
  // fallback về dữ liệu hiện có của getWeekInfo.
  const sizeCm = guide.baby.sizeCm || info.fetalLengthCm
  const weightG = guide.baby.weightG || info.fetalWeightG
  const comparison = guide.baby.comparison || info.fetalSize

  return (
    <div className="space-y-6">
      <SectionTabs tabs={THAI_KY_TABS} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-fg md:text-2xl">Tuần {info.week}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="primary">{TRIMESTER_LABELS[info.trimester]}</Badge>
            <Badge tone="neutral">{guide.phase}</Badge>
          </div>
        </div>
        <WeekNav week={week} />
      </div>

      <section className="rounded-lg border border-border bg-primary-soft p-5 shadow-card">
        <p className="text-sm font-medium text-primary-strong">Bé đang lớn như…</p>
        <p className="mt-1 text-2xl font-semibold text-fg">{comparison}</p>
        {sizeCm || weightG ? (
          <p className="mt-1 text-sm text-muted">
            {sizeCm ? `${sizeCm} cm` : ''}
            {sizeCm && weightG ? ' · ' : ''}
            {weightG ? `${weightG} g` : ''}
            {sizeCm && sizeCm < 20 ? ' (chiều dài đầu–mông)' : ''}
          </p>
        ) : null}
        {isMulti && (
          <p className="mt-2 text-xs text-muted">
            Đa thai: mốc trên là tham khảo của thai đơn — mỗi bé trong {activeFetuses.length}-thai có thể nhỏ hơn,
            tham khảo bác sĩ khi khám.
          </p>
        )}
        {isMulti && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFetuses.map((f) => (
              <Badge key={f.id} tone="neutral">
                {fetusDisplayName(f)}
                {genderLabel(f.sex) ? ` · ${genderLabel(f.sex)}` : ''}
              </Badge>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          Số liệu kích thước là tham khảo; chỉ số thực tế của bé do bác sĩ đo trên siêu âm.
        </p>
      </section>

      <Card title="Tuần của bé" description={guide.phase}>
        <ul className="list-inside list-disc space-y-2 text-sm text-fg">
          {guide.baby.development.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <Sources sources={guide.baby.sources} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Mẹ thay đổi gì">
          {info.momChanges.length > 0 && (
            <ul className="list-inside list-disc space-y-1.5 text-sm text-fg">
              {info.momChanges.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Thay đổi cơ thể</p>
              <ul className="mt-1 list-inside list-disc space-y-1.5 text-sm text-fg">
                {guide.mom.changes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            {guide.mom.symptoms.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Triệu chứng hay gặp</p>
                <ul className="mt-1 list-inside list-disc space-y-1.5 text-sm text-fg">
                  {guide.mom.symptoms.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Mệt mỏi & giấc ngủ</p>
              <p className="mt-1 text-sm text-fg">{guide.mom.sleepAndEnergy}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Vận động</p>
              <p className="mt-1 text-sm text-fg">{guide.mom.exercise}</p>
            </div>
          </div>
          <Sources sources={guide.mom.sources} />
        </Card>

        <Card title="Dinh dưỡng tuần" description="Trọng tâm vi chất + hàm lượng cụ thể mỗi ngày">
          <ul className="space-y-3">
            {guide.nutrition.focus.map((f) => (
              <li key={f.name} className="rounded-lg border border-border bg-surface-muted/40 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-fg">{f.name}</span>
                  {f.need && <Badge tone="primary">Cần {f.need}</Badge>}
                </div>
                <p className="mt-1 text-sm text-fg">{f.reason}</p>
                {f.foods.length > 0 && (
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    <span className="font-medium text-fg">Nguồn thực phẩm giàu {f.name}:</span> {f.foods.join(' · ')}
                  </p>
                )}
                {f.ul ? <p className="mt-1 text-xs text-warning">⚠️ {f.ul}</p> : null}
              </li>
            ))}
          </ul>
          {guide.nutrition.suggestedFoods.length > 0 && (
            <p className="mt-3 text-sm text-fg">
              <span className="font-medium">Món gợi ý tuần này:</span> {guide.nutrition.suggestedFoods.join(' · ')}
            </p>
          )}
          {guide.nutrition.dailyGoals && (
            <p className="mt-2 text-sm text-fg">
              <Badge tone="accent" className="mr-2">
                Mục tiêu
              </Badge>
              {guide.nutrition.dailyGoals}
            </p>
          )}
          {guide.nutrition.notes && (
            <p className="mt-2 text-sm text-fg">
              <span className="font-medium">Lưu ý:</span> {guide.nutrition.notes}
            </p>
          )}
          <Sources sources={guide.nutrition.sources} />
        </Card>

        <Card title="Checklist tuần" description="Khám, xét nghiệm & việc cần làm">
          {info.appointmentsDue.length > 0 || guide.checklist.length > 0 ? (
            <ul className="list-inside list-disc space-y-1.5 text-sm text-fg">
              {info.appointmentsDue.map((c) => (
                <li key={c}>{c}</li>
              ))}
              {guide.checklist.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Tuần này chưa có mốc khám bắt buộc.</p>
          )}
          {info.todo.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Việc cần làm</p>
              <ul className="mt-1 space-y-2">
                {info.todo.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-fg">
                    <span aria-hidden className="mt-0.5 text-primary-strong">
                      ☐
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Sources sources={guide.checklistSources} />
        </Card>

        <Card title="Lưu ý — dấu hiệu cần gặp bác sĩ" className="border-warning/60">
          <ul className="space-y-2">
            {guide.warnings.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-fg">
                <span aria-hidden className="mt-0.5 shrink-0 font-bold text-warning">
                  !
                </span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-warning/10 p-3 text-xs leading-relaxed text-muted">
            Đây là hướng dẫn giáo dục sức khỏe, không thay thế tư vấn y khoa. Khi băn khoăn hoặc triệu chứng kéo dài,
            hãy liên hệ bác sĩ sản khoa của bạn.
          </p>
          <Sources sources={guide.warningSources} />
        </Card>
      </div>
    </div>
  )
}
