// ===========================================================================
// parse.ts — parser THUẦN (không phụ thuộc framework/dep) cho import triệu chứng.
// Nhận text do người dùng dán vào (trang /nhap-lieu) → danh sách items hợp lệ
// cho POST /api/v1/import/symptoms.
//
// Hỗ trợ 2 format:
//   1. Dòng đơn: mỗi dòng "Tên triệu chứng" hoặc "Tên triệu chứng | mức | ngày"
//      - mức: nhẹ/vừa/nặng (hoặc mild/moderate/severe, không phân biệt dấu/hoa)
//      - ngày: YYYY-MM-DD | dd/mm/yyyy | dd/mm (mặc định năm hiện tại, giờ VN)
//      - thứ tự mức/ngày linh hoạt; trường không nhận diện → ghi chú (note)
//   2. Mảng JSON: [{ "symptom", "severity", "started_at"?, "note"? }]
//
// Đầu ra luôn là ISO datetime offset +07:00 cho `started_at` (khớp schema route).
// ===========================================================================

import type { SymptomSeverity } from '@mevabe/domain'
import { SEVERITY_LABELS } from '../labels'

/** Số tối đa triệu chứng một lần import (khớp max 100 của route). */
export const MAX_IMPORT = 100

export interface ParsedSymptom {
  symptom: string
  severity: SymptomSeverity
  started_at: string
  note?: string
}

export interface ParseResult {
  ok: boolean
  items: ParsedSymptom[]
  /** Lỗi từng dòng/phần tử — vẫn cho lưu phần hợp lệ nếu items có. */
  errors: string[]
}

// ---- nhận diện mức độ: bỏ dấu + thường hoá, đối chiếu SEVERITY_LABELS ----
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

const SEV_BY_WORD: Record<string, SymptomSeverity> = {}
for (const [sev, label] of Object.entries(SEVERITY_LABELS)) {
  SEV_BY_WORD[stripDiacritics(label)] = sev as SymptomSeverity
}
SEV_BY_WORD['trung binh'] = 'moderate'
SEV_BY_WORD['mild'] = 'mild'
SEV_BY_WORD['moderate'] = 'moderate'
SEV_BY_WORD['severe'] = 'severe'

function severityOf(word: string): SymptomSeverity | null {
  return SEV_BY_WORD[stripDiacritics(word)] ?? null
}

// ---- ngày: linh hoạt YYYY-MM-DD / dd/mm/yyyy / dd/mm ----
const VN_OFFSET = '+07:00'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function isValidDate(y: number, m: number, d: number): boolean {
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}T00:00:00${VN_OFFSET}`
}

/** Hôm nay theo giờ VN (Asia/Ho_Chi_Minh), dạng ISO +07:00. */
export function todayIso(): string {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return `${s}T00:00:00${VN_OFFSET}`
}

/** Parse một token ngày → ISO +07:00; null nếu không hợp lệ. */
export function parseDateToken(tok: string): string | null {
  const t = tok.trim()
  let m: RegExpMatchArray | null
  if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    return isValidDate(y, mo, d) ? isoDate(y, mo, d) : null
  }
  if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
    const d = Number(m[1])
    const mo = Number(m[2])
    const y = Number(m[3])
    return isValidDate(y, mo, d) ? isoDate(y, mo, d) : null
  }
  if ((m = t.match(/^(\d{1,2})\/(\d{1,2})$/))) {
    const d = Number(m[1])
    const mo = Number(m[2])
    const y = new Date().getFullYear()
    return isValidDate(y, mo, d) ? isoDate(y, mo, d) : null
  }
  return null
}

function validDatetime(s: string): boolean {
  return !isNaN(new Date(s).getTime())
}

// ---- dòng đơn ----
function parseLine(line: string): { item?: ParsedSymptom; error?: string } {
  const parts = line.split('|').map((p) => p.trim())
  const name = parts[0]
  if (!name) return { error: 'thiếu tên triệu chứng' }
  if (name.length > 100) return { error: `“${name}” dài quá 100 ký tự` }

  let severity: SymptomSeverity = 'mild'
  let started_at = todayIso()
  const notes: string[] = []
  for (const field of parts.slice(1).filter(Boolean)) {
    const sev = severityOf(field)
    if (sev) {
      severity = sev
      continue
    }
    const dt = parseDateToken(field)
    if (dt) {
      started_at = dt
      continue
    }
    // Trông giống ngày (bắt đầu bằng chữ số) mà không hợp lệ → báo lỗi,
    // không nuốt thành ghi chú (tránh nhầm 32/13 thành chú thích).
    if (/^\d/.test(field)) {
      return { error: `ngày “${field}” không hợp lệ (YYYY-MM-DD hoặc dd/mm)` }
    }
    // Không nhận diện → coi là ghi chú (khoan dung, không chặn dòng).
    notes.push(field)
  }

  const item: ParsedSymptom = { symptom: name, severity, started_at }
  if (notes.length) item.note = notes.join('; ')
  return { item }
}

function parseLines(text: string): ParseResult {
  const items: ParsedSymptom[] = []
  const errors: string[] = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim()
    if (!line || line.startsWith('#')) continue
    if (items.length + errors.length >= MAX_IMPORT) {
      errors.push(`Tối đa ${MAX_IMPORT} triệu chứng — các dòng sau đã bỏ qua.`)
      break
    }
    const r = parseLine(line)
    if (r.error) errors.push(`Dòng ${i + 1}: ${r.error}`)
    else items.push(r.item!)
  }
  return { ok: items.length > 0, items, errors }
}

// ---- mảng JSON ----
function parseJson(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, items: [], errors: ['JSON không hợp lệ — kiểm tra dấu ngoặc, phẩy, nháy kép.'] }
  }
  if (!Array.isArray(raw)) {
    return {
      ok: false,
      items: [],
      errors: ['Phải là mảng JSON, vd [{ "symptom": "Đau đầu", "severity": "nhẹ", "started_at": "2026-08-01" }]'],
    }
  }
  const items: ParsedSymptom[] = []
  const errors: string[] = []
  for (let i = 0; i < raw.length; i++) {
    if (items.length + errors.length >= MAX_IMPORT) {
      errors.push(`Tối đa ${MAX_IMPORT} triệu chứng — các phần tử sau đã bỏ qua.`)
      break
    }
    const it = raw[i] as Record<string, unknown> | null
    const tag = `Phần tử ${i + 1}`
    if (!it || typeof it !== 'object') {
      errors.push(`${tag}: phải là object.`)
      continue
    }
    const symptom = typeof it.symptom === 'string' ? it.symptom.trim() : ''
    if (!symptom) {
      errors.push(`${tag}: thiếu "symptom".`)
      continue
    }
    if (symptom.length > 100) {
      errors.push(`${tag}: "symptom" dài quá 100 ký tự.`)
      continue
    }
    const sevRaw = typeof it.severity === 'string' ? it.severity : 'mild'
    const severity = severityOf(sevRaw)
    if (!severity) {
      errors.push(`${tag}: mức “${sevRaw}” không hợp lệ (nhẹ/vừa/nặng).`)
      continue
    }
    let started_at = todayIso()
    if (typeof it.started_at === 'string' && it.started_at.trim()) {
      const t = it.started_at.trim()
      if (t.includes('T')) {
        if (!validDatetime(t)) {
          errors.push(`${tag}: ngày “${t}” không hợp lệ.`)
          continue
        }
        started_at = t
      } else {
        const dt = parseDateToken(t)
        if (!dt) {
          errors.push(`${tag}: ngày “${t}” không hợp lệ (YYYY-MM-DD hoặc dd/mm).`)
          continue
        }
        started_at = dt
      }
    }
    const note = typeof it.note === 'string' && it.note.trim() ? it.note.trim() : undefined
    items.push({ symptom, severity, started_at, note })
  }
  return { ok: items.length > 0, items, errors }
}

/** Parse text dán vào: tự nhận diện JSON hay dòng đơn. */
export function parseSymptoms(text: string): ParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, items: [], errors: [] }
  return trimmed.startsWith('[') ? parseJson(trimmed) : parseLines(trimmed)
}
