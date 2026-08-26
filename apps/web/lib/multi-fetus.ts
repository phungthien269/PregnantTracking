// Đa thai — helper thuần (không React) dùng chung cho dashboard, trang tuần,
// fetal-log và onboarding. Giữ logic gắn/đọc thai trong nhật ký test được.
import type { Fetus, Gender } from '@mevabe/domain'

/** Tên hiển thị của thai: 'Thai A', 'Thai B', … hoặc 'Thai 1/2/3' nếu chưa đặt tên. */
export function fetusDisplayName(f: Fetus): string {
  if (f.name) return `Thai ${f.name}`
  return `Thai ${f.birth_order}`
}

/** Ký tự gắn thai trong nhật ký (name A/B/C; fallback theo birth_order). */
export function fetusKey(f: Fetus): string {
  return f.name ?? String.fromCharCode(64 + f.birth_order)
}

/** Nhãn giới tính tiếng Việt. */
export function genderLabel(g?: Gender | null): string | null {
  return g === 'male' ? 'Bé trai' : g === 'female' ? 'Bé gái' : null
}

/** Mô tả ngắn 1 thai: giới tính · ghi chú (nếu có). */
export function fetusSummary(f: Fetus): string {
  return [genderLabel(f.sex), f.notes].filter(Boolean).join(' · ')
}

// ---------------------------------------------------------------------------
// Gắn thai vào nhật ký thai máy.
// Giới hạn: DataApi.addFetalMovement chưa có cột fetus_id (không được sửa
// lib/data/*). Workaround: lưu marker `[A]` vào đầu `note`, đọc lại khi hiển
// thị. Khi data layer có fetus_id thì thay bằng field riêng (ghi chú ở status).
// ---------------------------------------------------------------------------

export interface FetusNote {
  /** Key thai ('A'/'B'/'C') hoặc null nếu không gắn. */
  fetusKey: string | null
  /** Phần note sạch (đã bỏ marker). */
  note: string
}

/** Gắn marker thai vào note: `[A] nội dung`. fetusKey null → note nguyên vẹn. */
export function tagFetusNote(fetusKey: string | null, note: string): string {
  const trimmed = note.trim()
  if (!fetusKey) return trimmed
  return trimmed ? `[${fetusKey}] ${trimmed}` : `[${fetusKey}]`
}

/** Đọc marker thai từ note đã lưu. */
export function parseFetusNote(note: string | null | undefined): FetusNote {
  if (!note) return { fetusKey: null, note: '' }
  const m = /^\[([A-Z])\](?:\s+|$)/.exec(note)
  if (!m) return { fetusKey: null, note }
  return { fetusKey: m[1]!, note: note.slice(m[0].length) }
}
