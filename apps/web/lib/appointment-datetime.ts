// ===========================================================================
// Chuyển đổi ngày giờ cho form lịch khám (Agent 6B).
// Thuần (không import `@/`) để self-check chạy bằng node đơn lẻ.
// - <input type="datetime-local"> trả giá trị local "yyyy-MM-ddTHH:mm"
// - route /api/v1/appointments cần ISO có offset (z.string().datetime({ offset: true }))
// ===========================================================================

/** datetime-local (local time) → ISO có offset (UTC "…Z"), đúng schema route. */
export function fromLocalInput(v: string): string {
  return new Date(v).toISOString()
}

/** ISO → giá trị cho <input type="datetime-local"> (giờ máy local). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
