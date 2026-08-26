'use client'

import { Badge, Card } from '@mevabe/ui'
import { MEAL_LABELS } from '@/lib/labels'
import { buildMealPlan } from '@/lib/symptom-meals'

interface Props {
  /** Danh sách triệu chứng đã lưu; chỉ triệu chứng chưa kết thúc được dùng để gợi ý. */
  symptoms: Array<{ symptom: string; ended_at?: string | null }>
  /** Tuần thai hiện tại (tính từ LMP); null nếu chưa có thai kỳ → không lọc tam cá nguyệt. */
  week?: number | null
}

/**
 * Gợi ý món ăn theo triệu chứng ăn uống đang active (buồn nôn, chán ăn,
 * đổi khẩu vị, ợ nóng). Chỉ render khi có triệu chứng liên quan ăn uống —
 * không ảnh hưởng luồng ghi nhật ký. Nội dung là giáo dục dinh dưỡng,
 * không thay thế lời khuyên bác sĩ.
 */
export function SymptomMealSuggestions({ symptoms, week }: Props) {
  const plans = buildMealPlan(symptoms.filter((s) => !s.ended_at), { week: week ?? null, limit: 3 })
  if (plans.length === 0) return null

  return (
    <Card
      title="Gợi ý món ăn cho mẹ"
      description="Dựa trên triệu chứng ăn uống đang ghi nhận — món Việt nhẹ, dễ tiêu."
    >
      <div className="space-y-5">
        {plans.map((plan) => (
          <section key={plan.category} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success">{plan.def.label}</Badge>
              {plan.matchedSymptoms.map((s) => (
                <span key={s} className="text-xs text-muted">
                  “{s}”
                </span>
              ))}
            </div>
            <p className="text-sm text-muted">{plan.def.intro}</p>

            <ul className="space-y-2">
              {plan.suggestions.map(({ meal }) => (
                <li key={meal.id} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className="font-medium text-fg">{meal.name}</p>
                    <span className="shrink-0 text-xs text-muted">
                      {MEAL_LABELS[meal.mealType]} · {meal.serving}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{meal.note}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {meal.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-success"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-md bg-surface-muted p-3 text-xs text-muted">
              <p className="font-medium text-fg">Lưu ý chuyên môn</p>
              <p className="mt-1">{plan.def.advice}</p>
            </div>

            <div className="rounded-md bg-warning/10 p-3 text-xs text-muted">
              <p className="font-medium text-warning">Nên liên hệ bác sĩ khi</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {plan.def.danger.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        <p className="text-xs text-muted">
          Gợi ý mang tính giáo dục dinh dưỡng, không thay thế lời khuyên của bác sĩ.
        </p>
      </div>
    </Card>
  )
}
