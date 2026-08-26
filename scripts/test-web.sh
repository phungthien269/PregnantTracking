#!/usr/bin/env bash
# ===========================================================================
# test-web.sh — chạy bộ check/test web (.check.ts / .test.ts dưới apps/web).
# KHÔNG đụng scripts/test-domain.sh của agent 9.
# Dùng loader riêng: scripts/test-web-loader.mjs (thêm /index.ts + next/server).
#   cd code && scripts/test-web.sh
# Exit 0 nếu toàn bộ PASS; exit 1 nếu có FAIL.
# ===========================================================================
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
LOADER="$SCRIPT_DIR/test-web-loader.mjs"

if [[ ! -f "$LOADER" ]]; then
  echo "❌ Không thấy test-web-loader.mjs: $LOADER" >&2
  exit 1
fi

PASS=0
FAIL=0
FAILED_FILES=()

# Tìm test web: *.check.ts + *.test.ts (tương thích bash 3.2 — không dùng mapfile)
FILES=$(find "$ROOT/apps/web" \( -name '*.check.ts' -o -name '*.test.ts' \) | sort)

if [[ -z "$FILES" ]]; then
  echo "⚠️  Không có file *.check.ts / *.test.ts nào dưới apps/web." >&2
  exit 1
fi

while IFS= read -r f; do
  rel="${f#"$ROOT"/}"
  log="$(mktemp)"
  if node --experimental-strip-types --import "$LOADER" "$f" >"$log" 2>&1; then
    PASS=$((PASS + 1))
    echo "PASS  $rel"
  else
    FAIL=$((FAIL + 1))
    FAILED_FILES+=("$rel")
    echo "FAIL  $rel"
    echo "      --- log ---"
    sed 's/^/      | /' "$log" | tail -25
    echo "      --- hết log ---"
  fi
  rm -f "$log"
done < <(printf '%s\n' "$FILES")

echo
echo "Kết quả: $PASS pass, $FAIL fail (tổng $((PASS + FAIL)) file)."
if [[ $FAIL -gt 0 ]]; then
  echo "File lỗi:"
  for rel in "${FAILED_FILES[@]}"; do
    echo "  - $rel"
  done
  exit 1
fi
echo "✅ test-web: TẤT CẢ PASS."
exit 0
