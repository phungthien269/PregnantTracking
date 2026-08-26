import { Card } from '@mevabe/ui'
import { NUTRIENT_REFERENCES } from '@/lib/nutrition'
import type { NutrientReference } from '@/lib/nutrition'

type TrimesterKey = 'T1' | 'T2' | 'T3'

const TRIMESTER_RANGE: Record<TrimesterKey, string> = {
  T1: 'T1 (tuần 1–13)',
  T2: 'T2 (tuần 14–26)',
  T3: 'T3 (tuần 27–40)',
}

/** Số theo kiểu Việt: 1000 → "1.000", 2,3 → "2,3". */
const fmt = (n: number): string => n.toLocaleString('vi-VN')

/** "Cần X mg/ngày" cho tam cá nguyệt hiện tại, lấy từ needs[trimester].value.
 *  Riêng năng lượng: value là phần tăng thêm (0/340/450) → dùng display cho đúng nghĩa. */
function needText(ref: NutrientReference, t: TrimesterKey): string {
  const amt = ref.needs[t]
  if (ref.id === 'energy' || amt.value === null) return amt.display.split(' (')[0] ?? amt.display
  return `${fmt(amt.value)} ${ref.unit}/ngày`
}

/** Dải bổ sung khuyến nghị (min–max) + đơn vị; null/null → ghi chú ngắn hoặc "—". */
function rangeText(ref: NutrientReference): string {
  const { min, max } = ref.supplementRange
  if (min !== null && max !== null) return `${fmt(min)}–${fmt(max)} ${ref.unit}/ngày`
  if (min !== null) return `≥${fmt(min)} ${ref.unit}/ngày`
  if (max !== null) return `≤${fmt(max)} ${ref.unit}/ngày`
  return ref.supplementRangeNote ? ref.supplementRangeNote.split(' — ')[0] ?? '—' : '—'
}

/** Bảng nhu cầu hằng ngày cụ thể (mg/g/mcg/IU/L/kcal) theo tam cá nguyệt hiện tại. */
export function NutrientNeedsTable({ trimester }: { trimester: TrimesterKey }) {
  return (
    <Card
      title="Nhu cầu hằng ngày theo tuần thai hiện tại"
      description={`Hàm lượng cụ thể từng vi chất trong tam cá nguyệt ${TRIMESTER_RANGE[trimester]} — xem thẻ vi chất bên dưới để biết chi tiết nguồn và lưu ý.`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-3 font-medium">Vi chất</th>
              <th className="py-2 pr-3 font-medium">Cần / ngày ({trimester})</th>
              <th className="py-2 pr-3 font-medium">Bổ sung khuyến nghị</th>
              <th className="py-2 font-medium">Giàu nhất (100 g)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {NUTRIENT_REFERENCES.map((ref) => (
              <tr key={ref.id} className="align-top">
                <td className="py-2 pr-3 font-medium text-fg">{ref.name}</td>
                <td className="whitespace-nowrap py-2 pr-3 font-semibold text-success">
                  {needText(ref, trimester)}
                </td>
                <td className="py-2 pr-3 text-muted">{rangeText(ref)}</td>
                <td className="max-w-[14rem] py-2 text-muted">{ref.foodSources.slice(0, 2).join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
