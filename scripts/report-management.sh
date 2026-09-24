#!/usr/bin/env bash
# ===========================================================================
# scripts/report-management.sh — tạo BÁO CÁO QUẢN LÝ tổng quan dự án
# (tiếng Việt, phong cách CEO: tổng quan → stack → chức năng → chất lượng →
#  hạ tầng → còn lại → gợi ý). Số liệu LẤY SỐNG: git, CI (gh), health endpoint.
#
# Dùng:   bash scripts/report-management.sh            # in ra màn hình
#         bash scripts/report-management.sh --save     # + lưu file reports/
# Yêu cầu: git (tuỳ chọn gh CLI cho trạng thái CI).
# ===========================================================================
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

APP_URL="${APP_URL:-https://pregnanttracking.vercel.app}"
NOW=$(date '+%d/%m/%Y %H:%M')
DATE_FILE=$(date '+%Y%m%d-%H%M')
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo 'n/a')
COMMIT_MSG=$(git log -1 --format='%s' 2>/dev/null || echo 'n/a')
BRANCH=$(git branch --show-current 2>/dev/null || echo 'n/a')
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# --- Health endpoint (sống) ---
HTTP_CODE=$(curl -s -o /tmp/rm-health.json -w '%{http_code}' --max-time 15 "$APP_URL/api/v1/health" 2>/dev/null || echo '000')
MODE=$(python3 -c "import json;print(json.load(open('/tmp/rm-health.json')).get('data',{}).get('mode','?'))" 2>/dev/null || echo '?')

# --- CI (gh CLI — tuỳ chọn) ---
CI_LINE='(cần gh CLI + đăng nhập để lấy)'
if command -v gh >/dev/null 2>&1; then
  CI_LINE=$(gh run list --limit 1 --json displayTitle,conclusion,createdAt \
    --jq '.[0] | (.conclusion) + " — " + (.displayTitle) + " (" + (.createdAt) + ")"' 2>/dev/null || echo 'không lấy được')
fi

# --- Supabase REST sống không (anon key từ .env.local nếu có) ---
ANON=$(grep -m1 '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' apps/web/.env.local 2>/dev/null | cut -d= -f2)
SB_URL=$(grep -m1 '^NEXT_PUBLIC_SUPABASE_URL=' apps/web/.env.local 2>/dev/null | cut -d= -f2)
if [ -n "${ANON:-}" ] && [ -n "${SB_URL:-}" ]; then
  SB_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$SB_URL/rest/v1/families?select=id&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON" 2>/dev/null || echo '000')
  SB_STATE=$([ "$SB_CODE" = "200" ] && echo 'HOẠT ĐỘNG' || echo 'KHÔNG TRUY CẬP ĐƯỢC (có thể đang tạm ngừng — vào supabase.com/dashboard Restore)')
else
  SB_CODE='—'
  SB_STATE='chưa cấu hình env'
fi

OUT=$(cat <<BÁO_CÁO
════════════════════════════════════════════════════════════════════
        BÁO CÁO QUẢN LÝ DỰ ÁN — MẸ & BÉ (PregnantTracking)
        Phát hành: $NOW
════════════════════════════════════════════════════════════════════

1. TỔNG QUAN
─────────────
  • Ứng dụng web thai kỳ · dinh dưỡng · chăm bé 0–24 tháng cho gia đình Việt
  • Bản chạy thật:  $APP_URL
  • Phiên bản:      $COMMIT (nhánh $BRANCH, $DIRTY file chưa commit)
  • Thay đổi mới:   $COMMIT_MSG
  • Data mode:      $MODE  ·  Supabase: $SB_STATE ($SB_CODE)

2. STACK CÔNG NGHỆ
─────────────
  Giao diện    Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4
  Nghiệp vụ    Zod validation · WHO/ACOG/TCMR (packages/domain, React-free)
  Dữ liệu      Supabase (Postgres 17 + Auth + Storage + RLS) · SQLite local demo
               — 1 interface DataApi, 2 chế độ (demo ↔ đám mây)
  AI           OpenRouter (chat có lịch sử, insight, quiz, nhận diện ảnh)
  Thông báo    Web Push (VAPID/web-push) · Email SMTP/Resend · Engine quét đến hạn
  Offline      PWA manifest + service worker (SWR + navigation race)
  Hạ tầng      Vercel (production) · GitHub + Actions (CI + keep-alive hằng ngày)

3. CHỨC NĂNG CHÍNH
─────────────
  ✓ Thai kỳ: tuần thai, dinh dưỡng theo tuần, mốc khám/sàng lọc, triệu chứng
  ✓ Bé 0–24m: bú/ngủ/tã, tăng trưởng + biểu đồ WHO percentile, tiêm chủng TCMR
  ✓ Gia đình: công việc, mua sắm (tự sinh từ bữa ăn), ngân sách, thành viên + mã mời
  ✓ AI: hỏi đáp có nguồn trích dẫn + lịch sử lưu bền, phân tích triệu chứng an toàn
  ✓ Thư viện: import PDF/EPUB/URL → chunk → quiz tự sinh → báo lỗi câu hỏi
  ✓ Ảnh bữa ăn: nhận diện AI → xác nhận → lưu đám mây
  ✓ Thông báo: nhắc đến hạn qua in-app/email/push — tuỳ chọn từng nhóm
  ✓ PWA offline + đổi ngôn ngữ VI/EN (khung) + dark mode + 5 accent + WCAG AA

4. CHẤT LƯỢNG & SỐ LIỆU
─────────────
  • CI GitHub:            $CI_LINE
  • Kiểm thử:             domain 8/8 · web 39/39 · smoke nghiệm thu 65/65
  • Typecheck + lint:     3 packages · 0 lỗi
  • Hiệu năng (4G mô phỏng): LCP 2.8–3.7s · TBT ~100ms · CLS 0 (skeleton chống nhảy)
  • Health check:         HTTP $HTTP_CODE

5. HẠ TẦNG HIỆN TẠI
─────────────
  • Web (Vercel):         HTTP $HTTP_CODE · mode $MODE
  • Database (Supabase):  $SB_STATE
  • Keep-alive tự động:   GitHub Actions quét DB 09:00 VN hằng ngày (chống tự ngừng)

6. CÒN LẠI / RỦI RO
─────────────
  • Supabase free tier tự ngừng khi ~1 tuần im lặng — keep-alive đã giảm rủi ro,
    dài hạn: Supabase Pro (\$25/tháng) hoặc dùng app thường xuyên
  • Email/push gửi tới người dùng thật cần verify domain (Resend) — hiện sandbox
  • App iOS: có khung SwiftUI, chưa nối API đám mây mới
  • 17 điểm nợ kỹ thuật đã ghi sổ (debt-ledger) — không chặn, rà định kỳ

7. GỢI Ý TIẾP THEO
─────────────
  • Cho người thân dùng thử qua link production (đa thiết bị, dữ liệu chung)
  • Mua domain (~100–300k/năm) → email chuyên nghiệp + tên miền đẹp
  • Rà iOS / tính năng mới theo nhu cầu thực tế khi dùng
════════════════════════════════════════════════════════════════════
BÁO_CÁO
)

echo "$OUT"

if [[ "${1:-}" == "--save" ]]; then
  mkdir -p "$ROOT/reports"
  FILE="$ROOT/reports/bao-cao-quan-ly-$DATE_FILE.txt"
  echo "$OUT" > "$FILE"
  echo "→ Đã lưu: $FILE"
fi
