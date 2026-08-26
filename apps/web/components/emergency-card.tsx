'use client'

import { useEffect, useState } from 'react'
import { Badge, buttonClasses } from '@mevabe/ui'
import { data } from '@/lib/data/client-entry'
import { runAlertRules, type RuleAlert } from '@/lib/ai/alert-rules'

/** Thẻ cấp cứu — nổi bật cảnh báo KHẨN từ dữ liệu thật, kèm text + số hotline cố định. */
export function EmergencyCard({ className }: { className?: string }) {
  const [critical, setCritical] = useState<RuleAlert[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [measurements, symptoms, fetalLogs, profile] = await Promise.all([
        data.getMeasurements().catch(() => []),
        data.getSymptoms().catch(() => []),
        data.getFetalMovementLogs().catch(() => []),
        data.getNutritionProfile().catch(() => null),
      ])
      const alerts = runAlertRules({
        measurements,
        symptoms,
        fetalMovementLogs: fetalLogs,
        conditions: profile?.conditions ?? [],
      })
      if (alive) setCritical(alerts.filter((a) => a.severity === 'critical'))
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <section className={`rounded-lg border border-danger/40 bg-surface p-4 shadow-card ${className ?? ''}`}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-2xl">
          🚨
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-fg">Cần hỗ trợ khẩn cấp?</h2>
            <Badge tone="danger">Cấp cứu</Badge>
          </div>

          {critical.length > 0 && (
            <ul className="mt-3 space-y-2">
              {critical.map((a) => (
                <li key={a.ruleId} className="rounded-md bg-danger/10 px-3 py-2 text-sm font-medium text-danger" role="alert">
                  {a.message}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-sm text-muted">
            Nếu gặp dấu hiệu nguy hiểm (ra máu âm đạo, đau bụng dữ dội, co giật, thai máy giảm hẳn, vỡ ối…), hãy gọi ngay cấp cứu hoặc đến cơ sở y tế gần nhất.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="tel:115" className={buttonClasses('primary', 'sm')}>
              📞 Cấp cứu 115
            </a>
            <span className="inline-flex items-center rounded-md bg-surface-muted px-3 text-sm text-muted">
              Hoặc đến bệnh viện phụ sản gần nhất
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
