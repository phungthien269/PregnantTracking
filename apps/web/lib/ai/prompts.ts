// ===========================================================================
// Prompt builder — chat / symptom / insight. Quiz-gen có prompt riêng trong quiz-gen.ts.
// ===========================================================================

import type * as D from '@mevabe/domain'
import { weekFromLmp } from '../pregnancy-math'

const BASE = `Bạn là trợ lý "Mẹ & Bé" — ứng dụng chăm sóc thai kỳ, dinh dưỡng và nuôi con cho gia đình Việt.
Trả lời bằng tiếng Việt, ngắn gọn, ấm áp và có trách nhiệm.
KHÔNG hỏi hoặc nhắc đến thông tin định danh (tên, số điện thoại, email, địa chỉ).
Luôn ghi rõ đây là thông tin tham khảo, không thay thế bác sĩ. Với dấu hiệu nguy hiểm, khuyến khích gọi cấp cứu 115 hoặc đến cơ sở y tế.`

export function chatSystemPrompt(stage?: string | null, context?: string): string {
  const stageLine = stage ? `Mẹ đang ở giai đoạn: ${stage}. ` : ''
  const ctxLine = context
    ? `\n\nDưới đây là THÔNG TIN CÁ NHÂN của mẹ (dùng để trả lời sát thực tế — tuần thai, triệu chứng, đo lường... KHÔNG nhắc lại thông tin định danh):\n${context}`
    : ''
  return `${BASE}\n\n${stageLine}Trả lời dựa trên kiến thức chung và cẩm nang thai kỳ; không bịa nguồn.${ctxLine}`
}

/** Đầu vào cho buildChatContext — tương thích cấu trúc với DashboardSummary. */
export interface ChatContextInput {
  week: number
  trimester: string
  dueDate: string
  daysLeft: number
  mealCountToday: number
  waterLoggedMl: number
  waterGoalMl: number
  taskCount: number
  tasksDone: number
  recentSymptoms: Array<{ symptom: string; severity: string }>
  latestMeasurements: Array<{ type: string; value: number; unit: string; taken_at: string }>
  upcomingAppointments: Array<{ type: string; scheduled_at: string }>
}

/** Một lần khám trong ngữ cảnh AI — chỉ phần cần thiết, không chứa định danh cá nhân. */
export interface MedicalVisitContext {
  /** YYYY-MM-DD */
  visit_date: string
  clinic?: string | null
  reason?: string | null
  notes?: string | null
  /** Nội dung AI đọc được từ ảnh tài liệu (đã cắt ≤200 ký tự mỗi ảnh, ≤2 ảnh). */
  ocrTexts?: string[]
}

/** Dữ liệu bổ sung cho buildChatContext: đủ triệu chứng + LMP + lịch sử khám để AI biết triệu chứng ở tuần thai nào. */
export interface ChatContextOptions {
  symptoms?: D.SymptomReport[] | null
  lmp?: string | null
  medicalVisits?: MedicalVisitContext[]
  /** Tên tiếng Việt các tình trạng đặc biệt user đã khai (đã map qua CONDITION_LABELS — route lo). */
  conditions?: string[]
  /** Lưu ý/chỉ định của bác sĩ (doctor_instructions từ hồ sơ dinh dưỡng). */
  doctorInstructions?: string
}

/** Lược bỏ thông tin định danh (SĐT Việt Nam, email) trong văn bản tự do TRƯỚC khi
 * đưa vào prompt AI. Defense-in-depth: notes/reason/lưu ý bác sĩ là trường free-text
 * do người dùng tự nhập — có thể chứa SĐT/email mà khế ước cấm gửi ra prompt.
 * Tên người khó bóc bằng regex (dễ dương tính) nên không xử lý; SĐT/email đáng tin. */
function scrubPii(s: string): string {
  return s
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
    .replace(/(?:\+84|0)(?:\d[\s.-]?){8,9}\d/g, '[SĐT]')
}

/** Dựng chuỗi ngữ cảnh cá nhân từ dữ liệu dashboard — để AI trả lời SÁT user, không chung chung. */
export function buildChatContext(c: ChatContextInput, opts?: ChatContextOptions): string {
  const lines = [`Tuần thai: ${c.week} — ${c.trimester}.`, `Ngày dự sinh: ${c.dueDate} (còn ${c.daysLeft} ngày).`]
  const w = [...c.latestMeasurements].reverse().find((m) => m.type === 'weight')
  if (w) lines.push(`Cân nặng gần nhất: ${w.value} ${w.unit}.`)
  const bp = [...c.latestMeasurements].reverse().find((m) => m.type === 'blood_pressure')
  if (bp) lines.push(`Huyết áp gần nhất: ${bp.value} ${bp.unit}.`)

  // Tình trạng đặc biệt đã khai + lưu ý bác sĩ — AI trả lời đúng ngữ cảnh (VD tiểu đường thai kỳ).
  // Chỉ đưa tên tiếng Việt + lưu ý; KHÔNG đưa định danh.
  const conds = opts?.conditions?.filter((s) => s.trim().length > 0) ?? []
  if (conds.length > 0) lines.push(`Tình trạng đặc biệt đã khai báo: ${conds.join(', ')}.`)
  const inst = scrubPii(opts?.doctorInstructions?.trim() ?? '')
  if (inst) lines.push(`Lưu ý bác sĩ: ${inst.slice(0, 240)}.`)

  const allSyms = opts?.symptoms && opts.symptoms.length > 0 ? opts.symptoms : null
  if (allSyms) {
    // Tuần thai của mỗi triệu chứng = derived từ started_at + LMP (weekFromLmp clamp 1..42).
    const lmp = opts?.lmp ?? null
    const weeks = new Set<number>()
    const entries = [...allSyms]
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .slice(0, 10)
      .map((s) => {
        const week = lmp ? weekFromLmp(lmp, s.started_at.slice(0, 10)) : null
        if (week) weeks.add(week)
        return week ? `Tuần ${week} — ${s.symptom} (${s.severity})` : `${s.symptom} (${s.severity})`
      })
    lines.push(`Triệu chứng theo tuần thai: ${entries.join('; ')}.`)
    if (weeks.size >= 2) {
      const min = Math.min(...weeks)
      const max = Math.max(...weeks)
      lines.push(`Triệu chứng đã trải qua ${weeks.size} tuần (từ tuần ${min} đến tuần ${max}).`)
    }
  } else {
    const syms = c.recentSymptoms ?? []
    if (syms.length > 0) lines.push(`Triệu chứng gần đây: ${syms.slice(0, 3).map((s) => `${s.symptom} (${s.severity})`).join(', ')}.`)
  }
  if (c.mealCountToday > 0) lines.push(`Bữa ăn hôm nay: ${c.mealCountToday} bữa.`)
  if (c.waterLoggedMl > 0) lines.push(`Nước hôm nay: ${c.waterLoggedMl}/${c.waterGoalMl} ml.`)
  const nextApp = (c.upcomingAppointments ?? [])[0]
  if (nextApp) lines.push(`Lịch khám sắp tới: ${nextApp.type} (${nextApp.scheduled_at.slice(0, 10)}).`)
  // Lịch sử khám (mới nhất trước): tối đa 5 lần, mỗi lần ≤2 tài liệu, mỗi ocr_text ≤200 ký tự.
  const visits = opts?.medicalVisits?.slice(0, 5) ?? []
  if (visits.length > 0) {
    const visitLines = visits.map((v) => {
      const parts = [`ngày ${v.visit_date}`]
      if (v.clinic) parts.push(v.clinic)
      if (v.reason) parts.push(`lý do: ${v.reason}`)
      if (v.notes) parts.push(`ghi chú: ${v.notes}`)
      const ocr = (v.ocrTexts ?? [])
        .slice(0, 2)
        .map((t) => t.trim().slice(0, 200))
        .filter(Boolean)
      if (ocr.length > 0) parts.push(`nội dung ảnh đọc được: ${ocr.join(' | ')}`)
      return parts.join(' — ')
    })
    lines.push(`Lịch sử khám (mới nhất trước): ${visitLines.join('; ')}.`)
  }
  const left = c.taskCount - c.tasksDone
  if (left > 0) lines.push(`Còn ${left} việc cần làm chưa hoàn thành.`)
  return lines.join('\n')
}

export function symptomUserPrompt(symptom: string, week?: number): string {
  const lines = [`Mẹ mô tả triệu chứng: "${symptom}".`]
  if (week) lines.push(`Tuần thai hiện tại: ${week}.`)
  lines.push(
    'Trả lời JSON đúng định dạng: {"possible_causes":["..."],"actions":["..."],"sources":["..."]}.',
    'actions là bước cụ thể mẹ nên làm. sources là nguồn y khoa có thật (Việt Nam hoặc quốc tế) — không bịa nguồn.',
  )
  return lines.join('\n')
}

export function insightSystemPrompt(): string {
  return `${BASE}\n\nViết insight ngắn (1–2 câu), nhẹ nhàng, tiếng Việt. Không đưa khuyến cáo cứng.`
}
