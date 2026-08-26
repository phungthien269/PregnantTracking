import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'
import { getActiveUser } from '@/lib/auth/active-user'
import { assembleCsv, COLUMNS, TABLE_LABELS, TABLE_ORDER, VI, type Row } from '@/lib/export-csv'
import { questionReportStore } from '@/lib/question-reports'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getServerSupabase } from '@/lib/supabase-server'

// ===========================================================================
// Export & quyền riêng tư (Agent 7 task C.5 — polish I/6).
//   GET  /api/v1/export?format=csv  → dữ liệu thô các bảng chính (CSV + BOM)
//   GET  /api/v1/export?format=pdf  → tóm tắt hành trình (HTML → in ra PDF)
//   POST /api/v1/export             → xóa toàn bộ dữ liệu gia đình (RLS-aware)
// Không lib nặng: CSV ghép tay (lib/export-csv.ts), PDF dùng HTML→print (ponytail).
// ===========================================================================

/** Đọc log nước/caffeine trực tiếp (supabase) — mock không lưu log thô, trả []. */
async function readLogs(table: 'hydration_logs' | 'caffeine_logs'): Promise<Row[]> {
  if (!isSupabaseConfigured()) return []
  const client = await getServerSupabase()
  if (!client) return []
  const { data, error } = await client.from(table).select('*').order('logged_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Row[]
}

/** Gom dữ liệu chính — mỗi getter có lỗi (vd supabase chưa auth) thì bỏ qua, không chặn export. */
async function collect(): Promise<Record<string, Row[]>> {
  const safe = async <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null)
  const [pregnancy, fetuses, measurements, symptoms, appointments, meals, children, tasks, shopping, budget] =
    await Promise.all([
      safe(data.getPregnancy()),
      safe(data.getFetuses()),
      safe(data.getMeasurements()),
      safe(data.getSymptoms()),
      safe(data.getAppointments()),
      safe(data.getMeals()),
      safe(data.getChildren()),
      safe(data.getTasks()),
      safe(data.getShopping()),
      safe(data.getBudget()),
    ])
  const [hydration, caffeine, reports] = await Promise.all([
    safe(readLogs('hydration_logs')),
    safe(readLogs('caffeine_logs')),
    safe(questionReportStore.list()),
  ])
  return {
    pregnancy: pregnancy ? [pregnancy as Row] : [],
    fetuses: (fetuses ?? []) as Row[],
    measurements: (measurements ?? []) as Row[],
    symptoms: (symptoms ?? []) as Row[],
    appointments: (appointments ?? []) as Row[],
    meals: (meals ?? []) as Row[],
    hydration_logs: (hydration ?? []) as Row[],
    caffeine_logs: (caffeine ?? []) as Row[],
    children: (children ?? []) as Row[],
    tasks: (tasks ?? []) as Row[],
    shopping: (shopping ?? []) as Row[],
    budget: (budget ?? []) as Row[],
    question_reports: (reports ?? []) as Row[],
  }
}

async function buildCsv(): Promise<string> {
  return assembleCsv(await collect())
}

async function buildSummaryHtml(): Promise<string> {
  const tables = await collect()
  const dash = await data.getDashboard().catch(() => null)
  const esc = (s: unknown): string =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  const headers = (name: string): string =>
    (COLUMNS[name] ?? [])
      .map((h) => `<th>${esc(VI[h] ?? h)}</th>`)
      .join('')
  const rows = (name: string, t: Row[]): string =>
    t.length
      ? t
          .map(
            (r) =>
              `<tr>${(COLUMNS[name] ?? Object.keys(r))
                .map((k) => `<td>${esc(r[k])}</td>`)
                .join('')}</tr>`,
          )
          .join('')
      : '<tr><td>Chưa có dữ liệu</td></tr>'
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"/>
<title>Hành trình Mẹ & Bé — tóm tắt</title>
<style>
  @page { margin: 14mm }
  * { box-sizing: border-box }
  body{font-family:'Segoe UI',system-ui,-apple-system,Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;color:#1c1c1c;margin:2.4rem;line-height:1.55;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  h1{font-size:1.5rem;margin-bottom:.2rem}.sub{color:#666;font-size:.9rem;margin-bottom:1rem}
  h2{font-size:1.05rem;margin:1.4rem 0 .4rem;color:#6f3a2a}
  table{border-collapse:collapse;width:100%;font-size:.72rem;margin-bottom:.4rem}
  th,td{border:1px solid #ddd;padding:.3rem .45rem;text-align:left;vertical-align:top;word-break:break-word}
  th{background:#f7f0ea;white-space:nowrap}
  thead{display:table-header-group}tr{page-break-inside:avoid}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.4rem 1.2rem;margin-bottom:1rem}
  .k{color:#666}@media print{body{margin:0}}
</style></head><body>
<h1>Hành trình Mẹ & Bé</h1>
<p class="sub">Tóm tắt dữ liệu gia đình · xuất lúc ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</p>
${dash ? `<div class="grid"><div class="k">Tuần thai</div><div>${esc(dash.week)}</div><div class="k">Ngày dự sinh</div><div>${esc(dash.dueDate)}</div><div class="k">Còn lại</div><div>${esc(dash.daysLeft)} ngày</div><div class="k">Nước hôm nay</div><div>${esc(dash.waterLoggedMl)} / ${esc(dash.waterGoalMl)} ml</div></div>` : ''}
${TABLE_ORDER.map(
  (name) =>
    `<h2>${esc(TABLE_LABELS[name] ?? name)}</h2><table><thead><tr>${headers(name)}</tr></thead><tbody>${rows(name, tables[name] ?? [])}</tbody></table>`,
).join('')}
</body></html>`
}

export async function GET(req: Request): Promise<Response> {
  const format = new URL(req.url).searchParams.get('format') ?? 'csv'
  if (format === 'csv') {
    return new Response(await buildCsv(), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mevabe-export.csv"',
      },
    })
  }
  if (format === 'pdf') {
    return new Response(await buildSummaryHtml(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  return apiError('VALIDATION_ERROR', 'format phải là csv hoặc pdf')
}

export async function POST(): Promise<Response> {
  // Guard (Phase 7 polish): xoá dữ liệu gia đình phải có active user — trước đây
  // xoá sạch cả DB khi chưa đăng nhập.
  if (!getActiveUser()) {
    return apiError('UNAUTHORIZED', 'Vui lòng đăng nhập để xoá dữ liệu gia đình', undefined, 401)
  }
  await data.deleteFamilyData()
  return apiOk({ deleted: true })
}
