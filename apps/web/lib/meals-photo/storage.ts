// ===========================================================================
// Storage seam cho ảnh bữa ăn (server-only — chỉ route gọi, KHÔNG import ở client).
// Upload file ảnh lên nơi lưu:
//   - Supabase Storage: bucket `meal-photos` (runbook trong supabase/README.md §4)
//   - Mock: ghi file vào `apps/web/public/uploads/` — Next serve tĩnh qua `/uploads/...`
// Không có cấu hình Supabase → fallback mock (chạy demo không cần backend).
// ===========================================================================

import { supabase, isSupabaseConfigured } from '../supabase'
import { getServerSupabase } from '@/lib/supabase-server'

export interface StoredMealPhoto {
  /** Đường dẫn trong storage (truyền vào data.addMealPhoto làm storage_path). */
  storage_path: string
  /** URL hiển thị được (dùng làm img src / file_url). */
  file_url: string
}

/** Tên file an toàn: giữ ký tự hợp lệ, thêm timestamp tránh đè ảnh cùng tên. */
function safeName(fileName: string): string {
  const base = fileName.replace(/[^\w.\-]+/g, '_').slice(0, 80)
  return `${Date.now()}-${base || 'photo.jpg'}`
}

/** Upload ảnh bữa ăn; không có Supabase → mock (ghi public/uploads/). */
export async function storeMealPhoto(file: File | Blob, fileName: string): Promise<StoredMealPhoto> {
  const name = safeName(fileName)
  if (isSupabaseConfigured() && supabase) {
    const storage_path = `meals/${name}`
    // Dùng client đã xác thực (cookie sb_token) để upload — client anon bị RLS chặn
    // (policy storage chỉ cho `authenticated`). Server route → luôn có cookie.
    const client = (await getServerSupabase()) ?? supabase
    const { error } = await client.storage.from('meal-photos').upload(storage_path, file)
    if (error) throw error
    const { data } = supabase.storage.from('meal-photos').getPublicUrl(storage_path)
    return { storage_path, file_url: data.publicUrl }
  }
  // Mock: ghi vào public/uploads/ (Next serve tĩnh qua /uploads/<tên>).
  const { mkdir, writeFile } = await import('node:fs/promises')
  const nodePath = await import('node:path')
  const dir = nodePath.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(nodePath.join(dir, name), bytes)
  return { storage_path: `uploads/${name}`, file_url: `/uploads/${name}` }
}
