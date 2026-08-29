import { Badge, Card } from '@mevabe/ui'
import type { Citation, FoodSafetyItem } from '@/lib/nutrition'
import { SourceList } from '@/components/nutrition-citation'

const CATEGORY_LABEL = { avoid: 'TRÁNH', limit: 'HẠN CHẾ' } as const

function groupCitations(items: FoodSafetyItem[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const item of items) {
    for (const c of item.citations) {
      const key = `${c.org}|${c.url}`
      if (!seen.has(key)) {
        seen.add(key)
        out.push(c)
      }
    }
  }
  return out
}

/** Danh sách an toàn thực phẩm: nhóm TRÁNH + HẠN CHẾ, mỗi mục có lý do + nguồn. */
export function FoodSafetyList({ items }: { items: FoodSafetyItem[] }) {
  const avoid = items.filter((i) => i.category === 'avoid')
  const limit = items.filter((i) => i.category === 'limit')
  const groups = [
    { key: 'avoid' as const, items: avoid },
    { key: 'limit' as const, items: limit },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">
      {groups.map(({ key, items: group }) => (
        <Card key={key} title={`${CATEGORY_LABEL[key]} (${group.length})`}>
          <ul className="space-y-3">
            {group.map((item) => (
              <li key={item.id} className="border-l-2 border-border pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-fg">{item.item}</p>
                  {item.severity === 'high' && <Badge tone="danger">cảnh báo cao</Badge>}
                  {item.maxAmount && (
                    <Badge tone="neutral" className="max-w-full text-left">
                      {item.maxAmount}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.reason}</p>
              </li>
            ))}
          </ul>
          <SourceList citations={groupCitations(group)} />
        </Card>
      ))}
    </div>
  )
}
