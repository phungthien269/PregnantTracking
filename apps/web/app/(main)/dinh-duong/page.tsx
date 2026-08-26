import { data } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { Badge, Card } from '@mevabe/ui'
import {
  getWeeklyFocus,
  getNutrientReference,
  foodSafetyForTrimester,
  highSeverityFoodSafetyItems,
  MEALS,
  type MealType,
} from '@/lib/nutrition'
import { NutrientRecommendationCard } from '@/components/nutrition-recommendation-card'
import { NutrientNeedsTable } from '@/components/nutrient-needs-table'
import { FoodSafetyList } from '@/components/food-safety-list'
import { SourceList } from '@/components/nutrition-citation'
import { SectionTabs, DINH_DUONG_TABS } from '@/components/section-tabs'
import { VietnamNutritionNotes, VIETNAM_NOTES } from '@/components/vietnam-nutrition-notes'

type TrimesterKey = 'T1' | 'T2' | 'T3'

const T_TO_DIGIT: Record<TrimesterKey, '1' | '2' | '3'> = {
  T1: '1',
  T2: '2',
  T3: '3',
}

const NUTRIENT_TAGS: Record<string, string> = {
  folate: 'giàu folate',
  iron: 'giàu sắt',
  calcium: 'giàu canxi',
  dha: 'giàu DHA',
  vitamin_d: 'giàu vitamin D',
  vitamin_c: 'giàu vitamin C',
  zinc: 'giàu kẽm',
  choline: 'giàu choline',
  protein: 'giàu protein',
  fiber: 'giàu chất xơ',
}

const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: 'Sáng',
  lunch: 'Trưa',
  dinner: 'Tối',
  snack: 'Phụ',
  drink: 'Đồ uống',
}

/** Chọn món Việt phù hợp tam cá nguyệt, ưu tiên món có tag trùng trọng tâm tuần. */
function pickMeals(trimester: TrimesterKey, nutrientIds: string[], limit = 6) {
  const digit = T_TO_DIGIT[trimester]
  const wanted = new Set(nutrientIds.map((id) => NUTRIENT_TAGS[id]).filter(Boolean))
  return MEALS.filter((m) => m.trimester.includes(digit))
    .map((m) => ({ m, score: m.tags.filter((t) => wanted.has(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.m)
}

export default async function DinhDuongPage() {
  const dash = await data.getDashboard()
  const focus = await data.getNutritionFocus(dash.week)
  const weekFocus = getWeeklyFocus(dash.week)
  const trimester: TrimesterKey =
    weekFocus?.trimester ?? (dash.week <= 13 ? 'T1' : dash.week <= 26 ? 'T2' : 'T3')

  // An toàn thực phẩm: đủ mục theo tam cá nguyệt + luôn kèm mục cảnh báo cao (dedupe theo id).
  const seen = new Set<string>()
  const safetyItems = [...foodSafetyForTrimester(trimester), ...highSeverityFoodSafetyItems()].filter(
    (i) => {
      if (seen.has(i.id)) return false
      seen.add(i.id)
      return true
    },
  )

  const nutrientIds = weekFocus ? weekFocus.focus.map((f) => f.nutrientId) : []
  const meals = pickMeals(trimester, nutrientIds)

  return (
    <div className="space-y-6">
      <SectionTabs tabs={DINH_DUONG_TABS} />
      <PageHeader
        title="Dinh dưỡng"
        description={`Khuyến nghị theo tuần thai ${dash.week}${weekFocus ? ` (tuần ${weekFocus.weekStart}–${weekFocus.weekEnd})` : ''} — có trích dẫn nguồn, tham khảo cho mẹ Việt.`}
      />

      <NutrientNeedsTable trimester={trimester} />

      <VietnamNutritionNotes />

      {weekFocus && (
        <Card
          title={weekFocus.phaseLabel}
          description={`Tuần ${weekFocus.weekStart}–${weekFocus.weekEnd} · Tam cá nguyệt ${trimester}`}
        >
          <div className="space-y-3">
            {weekFocus.dailyGoals && (
              <div className="rounded-md bg-accent-soft/40 p-3">
                <p className="text-xs font-medium text-success">Mục tiêu hằng ngày</p>
                <p className="mt-0.5 text-sm text-fg">{weekFocus.dailyGoals}</p>
              </div>
            )}

            <ul className="space-y-2">
              {weekFocus.focus.map((f) => {
                const ref = getNutrientReference(f.nutrientId)
                return (
                  <li key={f.nutrientId} className="border-l-2 border-border pl-3">
                    <p className="text-sm font-medium text-fg">{ref?.name ?? f.nutrientId}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{f.reason}</p>
                  </li>
                )
              })}
            </ul>

            <div>
              <p className="text-xs font-medium text-muted">Thực phẩm gợi ý</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {weekFocus.suggestedFoods.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-success"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {weekFocus.notes && (
              <div className="rounded-md bg-warning/10 p-3">
                <p className="text-xs font-medium text-warning">Lưu ý giai đoạn</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{weekFocus.notes}</p>
              </div>
            )}

            <SourceList citations={weekFocus.citations} />
          </div>
        </Card>
      )}

      {nutrientIds.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-fg">Chi tiết vi chất & nguồn tham khảo</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {nutrientIds.map((id) => {
              const ref = getNutrientReference(id)
              return ref ? (
                <NutrientRecommendationCard
                  key={id}
                  reference={ref}
                  trimester={trimester}
                  vietnamNote={VIETNAM_NOTES[id]}
                />
              ) : null
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-fg">
          Nhóm chất mẹ cần chú ý ở tuần {focus.week}
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {focus.nutrients.map((n) => (
            <Card key={n.name} title={n.name} description={n.role}>
              <p className="text-xs font-medium text-muted">Thực phẩm giàu</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {n.foods.map((f) => (
                  <span key={f} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-success">
                    {f}
                  </span>
                ))}
              </div>
              {n.substitutes.length > 0 && (
                <>
                  <p className="mt-3 text-xs font-medium text-muted">Món thay thế</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {n.substitutes.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-fg"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {n.safetyNotes && n.safetyNotes.length > 0 && (
                <div className="mt-3 rounded-md bg-warning/10 p-3">
                  <p className="text-xs font-medium text-warning">Lưu ý an toàn</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-muted">
                    {n.safetyNotes.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {meals.length > 0 && (
        <Card
          title="Món ăn Việt gợi ý"
          description={`Ưu tiên món phù hợp tam cá nguyệt ${trimester} với trọng tâm tuần.`}
        >
          <ul className="divide-y divide-border">
            {meals.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <p className="text-sm font-medium text-fg">{m.name}</p>
                  <p className="text-xs text-muted">{m.serving}</p>
                  {m.note && <p className="mt-0.5 text-xs leading-relaxed text-muted">{m.note}</p>}
                </div>
                <Badge tone="neutral" className="shrink-0">
                  {MEAL_TYPE_LABEL[m.mealType]}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted">
            Dinh dưỡng món ăn tính từ CSDL thực phẩm (USDA FoodData Central / CSDL quốc tế, giá trị
            tham khảo) — nguồn chi tiết xem foods-data.ts.
          </p>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-fg">An toàn thực phẩm thai kỳ</h2>
        <FoodSafetyList items={safetyItems} />
      </div>

      <p className="flex items-center gap-2 text-sm text-muted">
        <Badge tone="neutral">Lưu ý</Badge>
        Thông tin tham khảo từ nội dung thư viện — không thay thế tư vấn của bác sĩ dinh dưỡng.
      </p>
    </div>
  )
}
export const dynamic = 'force-dynamic'
