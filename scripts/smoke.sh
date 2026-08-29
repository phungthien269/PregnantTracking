#!/usr/bin/env bash
# ===========================================================================
# scripts/smoke.sh — smoke test server production (PHASE 3 tích hợp).
#
# Tự động hoá đúng những gì orchestrator làm tay khi tích hợp:
#   - build (chỉ khi chưa có `.next/BUILD_ID` hoặc truyền `--rebuild`)
#   - next start -p <port tạm> → chờ ready
#   - curl từng route chính: kiểm tra HTTP status + envelope {data}/{error}
#   - in từng dòng PASS/FAIL (tiếng Việt) + tổng kết
#   - exit 0 nếu hết pass, exit 1 nếu có fail; trap dừng server khi xong
#
# Chạy:  cd code && scripts/smoke.sh            # dùng build có sẵn (nếu có)
#        cd code && scripts/smoke.sh --rebuild   # build mới rồi smoke
#        PORT=3199 scripts/smoke.sh              # đổi port
#
# Không cài thêm gì: bash + curl thuần. KHÔNG sửa code app/package.json/env.
# ===========================================================================
set -u

# Ép chế độ dữ liệu LOCAL (SQLite) cho smoke: NEXT_PUBLIC_* được inline lúc build,
# nên phải ghi đè TRƯỚC khi build/start. Supabase env (nếu có) sẽ làm mọi route dữ
# liệu 500 khi project Supabase không truy cập được. Xem apps/web/.env.local.
export NEXT_PUBLIC_SUPABASE_URL=""
export NEXT_PUBLIC_SUPABASE_ANON_KEY=""

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB="$ROOT/apps/web"
NEXT_BIN="$WEB/node_modules/.bin/next"
PORT="${PORT:-3199}"
BASE="http://127.0.0.1:$PORT"

REBUILD=0
for a in "$@"; do
  [[ "$a" == "--rebuild" ]] && REBUILD=1
done

PASS=0
FAIL=0
FAILED=()
SERVER_PID=""

TMP="$(mktemp -d)"
REQ_BODY="$TMP/body"
REQ_CODE="$TMP/code"
REQ_HDR="$TMP/hdr"
SERVER_LOG="$TMP/server.log"

cleanup() {
  # Kill wrapper `next start` + worker con `next-server` (giữ port) — tránh sót
  # process sau khi script thoát. `next start` spawn con nên kill PID cha không đủ.
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null
    wait "$SERVER_PID" 2>/dev/null
  fi
  local port_pid
  port_pid=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null)
  if [[ -n "$port_pid" ]]; then
    kill $port_pid 2>/dev/null
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT INT TERM

# req <curl args...> → chạy curl, lưu HTTP code/body/headers vào $REQ_CODE/…
req() { curl -sS -o "$REQ_BODY" -D "$REQ_HDR" -w '%{http_code}' "$@" > "$REQ_CODE"; }

# expect <name> <got_code> <exp_code> [--data|--error|--contains <txt>]...
# Ghi 1 dòng PASS/FAIL. Kiểm tra status, rồi envelope/chuỗi trong body.
expect() {
  local name="$1" got="$2" exp="$3"
  shift 3
  local detail=""
  [[ "$got" == "$exp" ]] || detail="HTTP $got (muốn $exp)"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --data)     if [[ -z "$detail" ]] && ! grep -q '"data"' "$REQ_BODY"; then detail="thiếu envelope {data}"; fi; shift ;;
      --error)    if [[ -z "$detail" ]] && ! grep -q '"error"' "$REQ_BODY"; then detail="thiếu envelope {error}"; fi; shift ;;
      --contains) if [[ -z "$detail" ]] && ! grep -qF "$2" "$REQ_BODY"; then detail="thiếu '$2' trong body"; fi; shift 2 ;;
      *) break ;;
    esac
  done
  if [[ -n "$detail" ]]; then
    FAIL=$((FAIL + 1)); FAILED+=("$name")
    echo "FAIL  $name — $detail"
    echo "      body: $(tr -d '\n' < "$REQ_BODY" | head -c 300)"
  else
    PASS=$((PASS + 1))
    echo "PASS  $name"
  fi
}

# jget <path.dotted> — lấy giá trị JSON từ $REQ_BODY bằng node (không cần jq).
# Dùng trong các luồng chéo cần trích id từ response rồi gọi tiếp.
jget() {
  node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[2],"utf8"));let v=d;for(const k of process.argv[1].split(".")){v=v?.[k];if(v===undefined)process.exit(1)}console.log(typeof v==="string"||typeof v==="number"||typeof v==="boolean"||v===null?v:JSON.stringify(v))' "$1" "$REQ_BODY"
}

# jnotif_reminder_count — đếm thông báo kind=reminder trong data.notifications
# (bỏ qua inbox — hộp thư lưu các thông báo đã gửi ở GET trước).
jnotif_reminder_count() {
  node -e 'const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log((d.data&&d.data.notifications||[]).filter(x=>x&&x.kind==="reminder").length)' "$REQ_BODY"
}

# ---------------------------------------------------------------------------
# Build (chỉ khi chưa có bản build hoặc có --rebuild)
# ---------------------------------------------------------------------------
if [[ "$REBUILD" == "1" || ! -f "$WEB/.next/BUILD_ID" ]]; then
  echo "▶ Build web ($WEB)…"
  (cd "$WEB" && pnpm build) || { echo "❌ Build thất bại." >&2; exit 1; }
else
  echo "▶ Dùng build có sẵn $WEB/.next (thêm --rebuild để build mới)"
fi

# ---------------------------------------------------------------------------
# Start + chờ ready
# ---------------------------------------------------------------------------
echo "▶ next start -p $PORT …"
(cd "$WEB" && exec "$NEXT_BIN" start -p "$PORT") >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

tries=0
until curl -sS -o /dev/null "$BASE/" 2>/dev/null; do
  tries=$((tries + 1))
  if [[ $tries -ge 60 ]]; then
    echo "❌ Server không sẵn sàng sau 60s." >&2
    sed 's/^/    | /' "$SERVER_LOG" | tail -20 >&2
    exit 1
  fi
  sleep 1
done
echo "✓ Server sẵn sàng ($BASE) — pid $SERVER_PID"
echo
echo "── Smoke routes ──"

# 1. GET / — redirect /dashboard (307) hoặc 200
req -sS "$BASE/"
code="$(cat "$REQ_CODE")"
if [[ "$code" =~ ^(200|301|302|307|308)$ ]]; then
  PASS=$((PASS + 1)); echo "PASS  GET / (HTTP $code)"
else
  FAIL=$((FAIL + 1)); FAILED+=("GET /")
  echo "FAIL  GET / — HTTP $code (muốn 302/200)"
fi

# 2. Tĩnh PWA: manifest + service worker
req -sS "$BASE/manifest.webmanifest"
expect "GET /manifest.webmanifest" "$(cat "$REQ_CODE")" 200
req -sS "$BASE/sw.js"
expect "GET /sw.js" "$(cat "$REQ_CODE")" 200

# 3. GET /api/v1/notifications — hộp thư in-app + thông báo đến hạn
req -sS "$BASE/api/v1/notifications"
expect "GET /api/v1/notifications" "$(cat "$REQ_CODE")" 200 --data

# 4. POST set pref hợp lệ (không gửi Origin → middleware bỏ qua origin check)
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"group":"reminders","channel":"in_app","enabled":true}' \
  "$BASE/api/v1/notifications"
expect "POST /api/v1/notifications set pref" "$(cat "$REQ_CODE")" 200 --data

# 5. CSRF — POST lệch Origin → 403 CSRF_ORIGIN
req -sS -X POST -H 'Content-Type: application/json' -H 'Origin: http://evil.example' \
  --data '{"group":"reminders","channel":"in_app","enabled":true}' \
  "$BASE/api/v1/notifications"
expect "POST lệch Origin → 403 CSRF_ORIGIN" "$(cat "$REQ_CODE")" 403 --contains 'CSRF_ORIGIN'

# 6. OCR extract — text tờ khám → items không rỗng
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"action":"extract","text":"Cân nặng 62.5, huyết áp 110/70"}' \
  "$BASE/api/v1/measurements/ocr"
expect "POST /api/v1/measurements/ocr extract" "$(cat "$REQ_CODE")" 200 --data --contains '"items":['
expect "  ocr extract có weight" "$(cat "$REQ_CODE")" 200 --contains '"weight"'
expect "  ocr extract có blood_pressure" "$(cat "$REQ_CODE")" 200 --contains '"blood_pressure"'

# 7. health-sync — payload HealthKit (id,type,value,unit,startedAt) → 200 {accepted}
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"source":"healthkit","samples":[{"id":"HK-W1","type":"weight","value":57.2,"unit":"kg","startedAt":"2026-08-03T07:00:00Z"},{"id":"HK-BP1","type":"blood_pressure","value":120,"unit":"mmHg","auxiliary":78,"startedAt":"2026-08-03T08:00:00Z"},{"id":"HK-HR1","type":"heart_rate","value":72,"unit":"lần/phút","startedAt":"2026-08-03T09:00:00+07:00"}]}' \
  "$BASE/api/v1/health-sync"
expect "POST /api/v1/health-sync" "$(cat "$REQ_CODE")" 200 --data --contains '"accepted":'

# 8. quiz report — uuid sai → 400 VALIDATION_ERROR
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"quiz_question_id":"khong-phai-uuid","reason":"Sai đáp án"}' \
  "$BASE/api/v1/quizzes/report"
expect "POST /api/v1/quizzes/report uuid sai → 400" "$(cat "$REQ_CODE")" 400 --error --contains 'VALIDATION_ERROR'

# 9. GET /api/v1/question-reports
req -sS "$BASE/api/v1/question-reports"
expect "GET /api/v1/question-reports" "$(cat "$REQ_CODE")" 200 --data

# 10. GET /api/v1/ai/chat — cấu hình AI
req -sS "$BASE/api/v1/ai/chat"
expect "GET /api/v1/ai/chat" "$(cat "$REQ_CODE")" 200 --data

# 11. Header rate-limit tồn tại trên GET API (request cuối /ai/chat)
if grep -qi '^X-RateLimit-Limit:' "$REQ_HDR"; then
  PASS=$((PASS + 1)); echo "PASS  Header rate-limit (X-RateLimit-Limit) trên GET API"
else
  FAIL=$((FAIL + 1)); FAILED+=("Rate-limit header")
  echo "FAIL  Header rate-limit — thiếu X-RateLimit-Limit trong response"
fi

# ===========================================================================
# PHẦN MỞ RỘNG (QA agent #1, Phase 3D) — phủ route còn thiếu + luồng chéo.
# Giữ nguyên 14 check gốc ở trên. Thứ tự có chủ đích vì mock lưu state trong
# server: GET-only → ghi nhanh/đo lường → health-sync → quiz report →
# notifications → thư viện import → export → XÓA DỮ LIỆU (cuối — reset).
# ===========================================================================

# 12. GET-only route coverage (mock seed) — đều phải trả envelope {data}.
for ep in pregnancies fetuses appointments children documents measurements meals symptoms tasks shopping-items supplements quizzes knowledge-sources; do
  req -sS "$BASE/api/v1/$ep"
  expect "GET /api/v1/$ep" "$(cat "$REQ_CODE")" 200 --data
done

# 13. Chat: có sessionId hợp lệ → 200 data; thiếu sessionId → 400 VALIDATION_ERROR.
req -sS "$BASE/api/v1/chat?sessionId=40000000-0000-0000-0000-000000000001"
expect "GET /api/v1/chat (sessionId hợp lệ)" "$(cat "$REQ_CODE")" 200 --data
req -sS "$BASE/api/v1/chat"
expect "GET /api/v1/chat thiếu sessionId → 400" "$(cat "$REQ_CODE")" 400 --error --contains 'VALIDATION_ERROR'

# 14. Children sub-routes (dùng child id seed) + param sai → 400.
CID="30000000-0000-0000-0000-000000000002"
for sub in feedings sleeps diapers growth milestones vaccinations; do
  req -sS "$BASE/api/v1/children/$CID/$sub"
  expect "GET /api/v1/children/[id]/$sub" "$(cat "$REQ_CODE")" 200 --data
done
req -sS "$BASE/api/v1/children/khong-phai-uuid/feedings"
expect "GET /children/[id] sai uuid → 400" "$(cat "$REQ_CODE")" 400 --error

# 15. Daily-logs: hợp lệ → data có meals; date sai → 400.
req -sS "$BASE/api/v1/daily-logs?date=2026-08-03"
expect "GET /api/v1/daily-logs?date=2026-08-03" "$(cat "$REQ_CODE")" 200 --data --contains '"meals"'
req -sS "$BASE/api/v1/daily-logs?date=sai-dinh-dang"
expect "GET /api/v1/daily-logs date sai → 400" "$(cat "$REQ_CODE")" 400 --error

# 16. Export format: csv (header tiếng Việt), pdf (html), format sai → 400.
req -sS "$BASE/api/v1/export?format=csv"
expect "GET /api/v1/export?format=csv" "$(cat "$REQ_CODE")" 200 --contains 'Bữa ăn'
req -sS "$BASE/api/v1/export?format=pdf"
expect "GET /api/v1/export?format=pdf" "$(cat "$REQ_CODE")" 200 --contains 'Hành trình Mẹ & Bé'
req -sS "$BASE/api/v1/export?format=xml"
expect "GET /api/v1/export format sai → 400" "$(cat "$REQ_CODE")" 400 --error

# 17. Notifications: reminder đến hạn hôm nay xuất hiện; tắt in_app reminders → hết;
#     bật lại → còn (pref phản ánh qua GET).
#     LƯU Ý: chỉ đếm trong data.notifications — body còn có inbox chứa reminder
#     đã gửi từ các GET trước, grep toàn body sẽ false-positive.
req -sS "$BASE/api/v1/notifications"
REM_CNT=$(jnotif_reminder_count)
if [[ "$REM_CNT" -gt 0 ]]; then
  PASS=$((PASS + 1)); echo "PASS  GET /api/v1/notifications có $REM_CNT reminder đến hạn hôm nay"
else
  FAIL=$((FAIL + 1)); FAILED+=("notifications reminder due"); echo "FAIL  GET /api/v1/notifications — thiếu reminder đến hạn"
fi
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"group":"reminders","channel":"in_app","enabled":false}' "$BASE/api/v1/notifications"
expect "POST tắt in_app reminders" "$(cat "$REQ_CODE")" 200 --data
req -sS "$BASE/api/v1/notifications"
REM_CNT=$(jnotif_reminder_count)
if [[ "$REM_CNT" -gt 0 ]]; then
  FAIL=$((FAIL + 1)); FAILED+=("notifications tắt pref"); echo "FAIL  Sau tắt in_app reminders, GET vẫn còn $REM_CNT reminder"
else
  PASS=$((PASS + 1)); echo "PASS  Tắt in_app reminders → GET /notifications không còn reminder (pref phản ánh)"
fi
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"group":"reminders","channel":"in_app","enabled":true}' "$BASE/api/v1/notifications"
expect "POST bật lại in_app reminders" "$(cat "$REQ_CODE")" 200 --data

# 18. Ghi nhanh → daily-logs phản ánh (addMeal API-level pass — quirk split-brain chỉ ở UI).
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"meal_type":"lunch","name":"Smoke phở bò","logged_at":"2026-08-04T12:00:00+07:00"}' "$BASE/api/v1/meals"
expect "POST /api/v1/meals ghi nhanh" "$(cat "$REQ_CODE")" 201 --data
req -sS "$BASE/api/v1/daily-logs?date=2026-08-04"
if grep -q 'Smoke phở bò' "$REQ_BODY"; then
  PASS=$((PASS + 1)); echo "PASS  GET /daily-logs phản ánh bữa ăn mới (luồng ghi nhanh)"
else
  FAIL=$((FAIL + 1)); FAILED+=("ghi nhanh daily-logs"); echo "FAIL  GET /daily-logs?date=2026-08-04 — không thấy bữa ăn vừa thêm"
fi

# 19. Đo lường → GET /measurements thấy cân nặng mới (source manual, không ghi đè).
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"type":"weight","value":61.5,"unit":"kg","taken_at":"2026-08-04T07:30:00+07:00","note":"Smoke QA"}' "$BASE/api/v1/measurements"
expect "POST /api/v1/measurements" "$(cat "$REQ_CODE")" 201 --data --contains '"source":"manual"'
req -sS "$BASE/api/v1/measurements"
if grep -q '61.5' "$REQ_BODY"; then
  PASS=$((PASS + 1)); echo "PASS  GET /measurements thấy cân nặng mới (luồng đo lường)"
else
  FAIL=$((FAIL + 1)); FAILED+=("đo lường GET"); echo "FAIL  GET /measurements — không thấy weight 61.5"
fi

# 20. Health-sync → GET /measurements có dòng source=healthkit (không ghi đè manual).
req -sS "$BASE/api/v1/measurements"
if grep -q '"source":"healthkit"' "$REQ_BODY"; then
  PASS=$((PASS + 1)); echo "PASS  GET /measurements có dòng source=healthkit (sau health-sync)"
else
  FAIL=$((FAIL + 1)); FAILED+=("healthkit persist"); echo "FAIL  GET /measurements — thiếu source=healthkit"
fi

# 21. Quiz report → moderation: POST hợp lệ → GET /question-reports thấy → PATCH resolved.
QR_QID="20000000-0000-0000-0000-000000000099"
req -sS -X POST -H 'Content-Type: application/json' \
  --data "{\"quiz_question_id\":\"$QR_QID\",\"reason\":\"Smoke báo lỗi\"}" "$BASE/api/v1/quizzes/report"
expect "POST /api/v1/quizzes/report hợp lệ" "$(cat "$REQ_CODE")" 201 --data --contains '"id"'
QRID=$(jget data.id)
req -sS "$BASE/api/v1/question-reports"
if grep -q "$QRID" "$REQ_BODY"; then
  PASS=$((PASS + 1)); echo "PASS  GET /question-reports thấy report mới (moderation)"
else
  FAIL=$((FAIL + 1)); FAILED+=("question-reports thấy report"); echo "FAIL  GET /question-reports — không thấy report mới"
fi
req -sS -X PATCH -H 'Content-Type: application/json' \
  --data '{"status":"resolved"}' "$BASE/api/v1/question-reports/$QRID"
expect "PATCH /api/v1/question-reports/[id] resolved" "$(cat "$REQ_CODE")" 200 --data --contains '"resolved"'

# 22. Thư viện import (text) → detail (chunks+stageTags) → confirm stage → quiz → delete.
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"text":"Chế độ dinh dưỡng cho bà bầu tuần 20 cần bổ sung canxi 1000mg, sắt 27mg và DHA 200mg mỗi ngày. Axit folic rất quan trọng trong tam cá nguyệt đầu. Vitamin D3 hỗ trợ hấp thu canxi tốt hơn. Nên ăn nhiều rau xanh, cá béo và uống đủ nước."}' \
  "$BASE/api/v1/knowledge-sources"
expect "POST /api/v1/knowledge-sources (text)" "$(cat "$REQ_CODE")" 201 --data --contains '"sourceId"'
SRC_ID=$(jget data.sourceId)
req -sS "$BASE/api/v1/knowledge-sources/$SRC_ID"
expect "GET /api/v1/knowledge-sources/[id]" "$(cat "$REQ_CODE")" 200 --data --contains '"chunks"'
req -sS -X PATCH -H 'Content-Type: application/json' \
  --data '{"stage":"pregnancy"}' "$BASE/api/v1/knowledge-sources/$SRC_ID"
expect "PATCH /api/v1/knowledge-sources/[id] confirm stage" "$(cat "$REQ_CODE")" 200 --data --contains '"ok"'
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{}' "$BASE/api/v1/knowledge-sources/$SRC_ID/quiz"
expect "POST /api/v1/knowledge-sources/[id]/quiz" "$(cat "$REQ_CODE")" 201 --data --contains '"quizSetId"'
req -sS -X DELETE "$BASE/api/v1/knowledge-sources/$SRC_ID"
expect "DELETE /api/v1/knowledge-sources/[id]" "$(cat "$REQ_CODE")" 200 --data --contains '"ok"'

# 23. Guard export (Phase 7 polish): CHƯA đăng nhập → POST export bị chặn 401
#     (trước đây xoá sạch cả DB). Đăng nhập demo → sync active user → được phép.
req -sS -X POST "$BASE/api/v1/export"
expect "POST /api/v1/export khi chưa đăng nhập → 401" "$(cat "$REQ_CODE")" 401 --error --contains 'UNAUTHORIZED'

# Đăng nhập demo (me@demo.vn / demo1234) → lưu cookie + user_id; sync active user.
req -sS -X POST -H 'Content-Type: application/json' \
  --data '{"email":"me@demo.vn","password":"demo1234"}' \
  -c "$TMP/cookies" "$BASE/api/v1/auth/login"
expect "POST /api/v1/auth/login demo" "$(cat "$REQ_CODE")" 200 --data --contains '"token"'
DEMO_UID=$(jget data.session.user_id)
req -sS -X POST -H 'Content-Type: application/json' \
  --data "{\"user_id\":\"$DEMO_UID\"}" -b "$TMP/cookies" "$BASE/api/v1/auth/sync"
expect "POST /api/v1/auth/sync active user" "$(cat "$REQ_CODE")" 200 --data

# Export-delete (CUỐI — reset toàn bộ dữ liệu): CSV phản ánh bữa ăn mới →
#     POST xóa → GET /measurements rỗng (reset thật).
req -sS "$BASE/api/v1/export?format=csv"
if grep -q 'Smoke phở bò' "$REQ_BODY"; then
  PASS=$((PASS + 1)); echo "PASS  CSV export chứa dữ liệu mới"
else
  FAIL=$((FAIL + 1)); FAILED+=("csv dữ liệu mới"); echo "FAIL  CSV export — không thấy 'Smoke phở bò'"
fi
req -sS -X POST -b "$TMP/cookies" "$BASE/api/v1/export"
expect "POST /api/v1/export (xóa dữ liệu gia đình)" "$(cat "$REQ_CODE")" 200 --data --contains '"deleted":true'
req -sS "$BASE/api/v1/measurements"
if grep -q '"data":\[\]' "$REQ_BODY"; then
  PASS=$((PASS + 1)); echo "PASS  Sau xóa dữ liệu, GET /measurements rỗng (reset)"
else
  FAIL=$((FAIL + 1)); FAILED+=("reset dữ liệu"); echo "FAIL  Sau POST /export, /measurements không rỗng"
fi

# 24. DataApi layer: mock self-check (onboarding/ghi nhanh/đo lường —
#     startPregnancy→EDD Naegele, getWeekInfo, getDashboard, addWater).
#     Chạy node riêng (không qua server) — kiểm tra seam DataApi, không phải HTTP.
if (cd "$WEB" && node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/data/mock.ts >"$TMP/mock-demo.log" 2>&1); then
  PASS=$((PASS + 1)); echo "PASS  mock.demo DataApi (startPregnancy→EDD, getWeekInfo, dashboard, addWater)"
else
  FAIL=$((FAIL + 1)); FAILED+=("mock.demo"); echo "FAIL  mock.demo DataApi"
  sed 's/^/      /' "$TMP/mock-demo.log" | head -6
fi

# ---------------------------------------------------------------------------
# Tổng kết
# ---------------------------------------------------------------------------
echo
echo "── Tổng kết ──"
echo "Kết quả: $PASS pass, $FAIL fail (tổng $((PASS + FAIL)))."
if [[ $FAIL -gt 0 ]]; then
  echo "Test lỗi:"
  for f in "${FAILED[@]}"; do echo "  - $f"; done
  exit 1
fi
echo "✅ smoke: TẤT CẢ PASS."
exit 0
