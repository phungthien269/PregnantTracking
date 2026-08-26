'use client'

// ===========================================================================
// Phân tích & chẩn đoán dinh dưỡng theo kỳ (Agent 6K).
// Người dùng chọn kỳ (7 ngày / 30 ngày / 3 tháng) → gọi
// /api/v1/daily-intake/analysis (server: getNutrientSummary + analyzeDeficiencies
// + AI viết lời) → hiện chất thiếu dai dẳng + món gợi ý + lời phân tích AI.
// AI lỗi/thiếu key → `ai: null` — vẫn hiện danh sách thiếu chất (không crash).
// ===========================================================================

import { useEffect, useState } from 'react'
import { Badge, Card, Select } from '@mevabe/ui'
import { VN_TZ } from '@/lib/format'
import { apiErrorMessage } from '@/lib/api-error'
import type { IntakeDiagnosis } from '@/lib/ai/intake-analysis'

const PERIODS = [
  { key: '7d', days: 7, label: '7 ngày' },
  { key: '30d', days: 30, label: '30 ngày' },
  { key: '3m', days: 90, label: '3 tháng' },
] as const

type PeriodKey = (typeof PERIODS)[number]['key']

const isoFmtVn = new Intl.DateTimeFormat('en-CA', {
  timeZone: VN_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Ngày cách đây `n` ngày (0 = hôm nay), dạng yyyy-MM-dd theo giờ VN. */
function daysAgo(n: number): string {
  return isoFmtVn.format(new Date(Date.now() - n * 86_400_000))
}

const pctTone = (pct: number | null): 'success' | 'warning' | 'danger' => {
  if (pct === null) return 'warning'
  if (pct >= 80) return 'success'
  if (pct >= 60) return 'warning'
  return 'danger'
}

export function IntakeDiagnosis() {
  const [period, setPeriod] = useState<PeriodKey>('7d')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IntakeDiagnosis | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const p = PERIODS.find((x) => x.key === period) ?? PERIODS[0]
    const from = daysAgo(p.days - 1)
    const to = daysAgo(0)
    setLoading(true)
    setError(null)
    fetch(`/api/v1/daily-intake/analysis?from=${from}&to=${to}&label=${encodeURIComponent(p.label)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.data) throw json
        if (!cancelled) setResult(json.data)
      })
      .catch((err) => {
        if (cancelled) return
        setResult(null)
        setError(apiErrorMessage(err, 'Không tải được phân tích dinh dưỡng.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  return (
    <Card
      title="Phân tích & chẩn đoán"
      description="Nhận diện chất thiếu dai dẳng theo kỳ + gợi ý bổ sung từ dữ liệu vi chất."
      action={
        <Select
          className="w-36"
          aria-label="Kỳ phân tích"
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
        >
          {PERIODS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
      }
    >
      {loading ? (
        <p className="text-sm text-slate-500">Đang phân tích…</p>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-slate-500">Vui lòng chọn kỳ khác hoặc thử lại sau.</p>
        </div>
      ) : result === null ? (
        <p className="text-sm text-slate-500">Chọn kỳ phân tích để xem kết quả.</p>
      ) : result.dayCount === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có nhật ký dinh dưỡng trong kỳ này. Ghi món/TPCN ở trên rồi quay lại để xem phân tích.
        </p>
      ) : (
        <div className="space-y-4">
          {result.ai?.text ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm leading-relaxed text-slate-800">{result.ai.text}</p>
              {result.ai.provider && (
                <p className="mt-2 text-xs text-slate-400">
                  ✨ Phân tích bởi AI — {result.ai.provider}/{result.ai.model}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {result.deficiencies.length === 0
                ? 'Không có chất thiếu dai dẳng trong kỳ này.'
                : 'Phần phân tích AI chưa khả dụng (chưa cấu hình AI hoặc lỗi kết nối) — dưới đây là danh sách chất thiếu từ dữ liệu thực.'}
            </p>
          )}

          {result.deficiencies.length === 0 ? (
            <p className="text-sm text-green-700">
              Tuyệt vời — các vi chất chính đều đạt từ 80% nhu cầu trở lên trong kỳ này.
            </p>
          ) : (
            <ul className="space-y-2">
              {result.deficiencies.map((d) => (
                <li key={d.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{d.name}</span>
                    <Badge tone={pctTone(d.pct)}>đạt {d.pct}%</Badge>
                    <span className="text-xs text-slate-500">
                      thiếu {d.lowDays}/{d.totalDays} ngày
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Nạp {d.total} {d.unit} / nhu cầu {d.need ?? '—'} {d.unit} mỗi ngày
                  </p>
                  {d.foodSuggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="text-xs font-medium text-slate-600">Bổ sung:</span>
                      {d.foodSuggestions.map((f) => (
                        <Badge key={f} tone="neutral">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {d.note && <p className="mt-2 text-xs text-slate-500">{d.note}</p>}
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-slate-400">
            Dữ liệu chỉ từ nhật ký dinh dưỡng của mẹ trong kỳ đã chọn — thông tin tham khảo, không
            thay thế lời khuyên bác sĩ.
          </p>
        </div>
      )}
    </Card>
  )
}
