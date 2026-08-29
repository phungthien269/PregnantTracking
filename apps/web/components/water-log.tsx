'use client'

import { useState } from 'react'
import { data, type WaterCaffeine } from '@/lib/data/client-entry'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import { Button, Card, ProgressRing } from '@mevabe/ui'

const LY_ML = 200
const CAFFE_COFFEE_MG = 80
const CAFFE_TEA_MG = 30

/** Theo dõi nước & caffeine 1 chạm. Nước lưu qua data.addWater(); caffeine chỉ theo dõi local. */
export function WaterLog({ initial }: { initial: WaterCaffeine }) {
  const [logged, setLogged] = useState(initial.waterLoggedMl)
  const [caff, setCaff] = useState(initial.caffeineLoggedMg)
  const [error, setError] = useState('')
  const pct = initial.waterGoalMl > 0 ? (logged / initial.waterGoalMl) * 100 : 0
  const caffPct = initial.caffeineLimitMg > 0 ? Math.min(100, (caff / initial.caffeineLimitMg) * 100) : 0

  // Optimistic: tăng ngay cho mượt; nếu lưu thất bại (offline 503…) → rollback + báo rõ.
  const addWater = async (amountMl: number) => {
    setLogged((l) => l + amountMl)
    setError('')
    try {
      await data.addWater({ logged_at: new Date().toISOString(), amount_ml: amountMl })
    } catch (err) {
      setLogged((l) => Math.max(0, l - amountMl))
      setError(isOfflineError(err) ? OFFLINE_MESSAGE : 'Chưa ghi được lượng nước — mẹ thử lại.')
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Nước hôm nay">
        <div className="flex flex-wrap items-center gap-5">
          <ProgressRing value={pct} label={`Nước ${pct.toFixed(0)}%`} />
          <div>
            <p className="text-sm text-muted">
              {logged} / {initial.waterGoalMl} ml
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => addWater(LY_ML)}>
                +1 ly (200ml)
              </Button>
              <Button size="sm" variant="secondary" onClick={() => addWater(500)}>
                +500ml
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <p className="mt-3 text-xs text-muted">Mỗi lần bấm sẽ ghi vào nhật ký nước trong ngày.</p>
      </Card>

      <Card title="Caffeine hôm nay">
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {caff} / {initial.caffeineLimitMg} mg
          </p>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-warning" style={{ width: `${caffPct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setCaff((c) => c + CAFFE_COFFEE_MG)}>
              +1 cà phê (80mg)
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setCaff((c) => c + CAFFE_TEA_MG)}>
              +1 trà (30mg)
            </Button>
          </div>
          <p className="text-xs text-muted">Caffeine chỉ theo dõi trong phiên (chưa có API ghi nước/caffeine).</p>
        </div>
      </Card>

      <Card title="Tham khảo" description="Chỉ theo dõi xu hướng, không khuyến cáo cứng.">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted">
          <li>Khuyến nghị tham khảo: khoảng 2–2.5 lít nước/ngày.</li>
          <li>Caffeine: giới hạn tham khảo ~200 mg/ngày khi mang thai.</li>
          <li>Mỗi mẹ khác nhau — hỏi bác sĩ mức phù hợp với mẹ.</li>
        </ul>
      </Card>
    </div>
  )
}
