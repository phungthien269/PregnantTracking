#!/usr/bin/env bash
# ===========================================================================
# test-domain.sh — chạy bộ test domain/ui (KHÔNG cần vitest).
# Dùng pattern đã có: `node --experimental-strip-types --import <node-loader.mjs>`.
#   cd code && scripts/test-domain.sh
# Exit 0 nếu toàn bộ test PASS; exit 1 nếu có FAIL.
# ===========================================================================
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
LOADER="$ROOT/apps/web/lib/library/node-loader.mjs"

if [[ ! -f "$LOADER" ]]; then
  echo "❌ Không thấy node-loader.mjs: $LOADER" >&2
  exit 1
fi

PASS=0
FAIL=0
FAILED_FILES=()

# Tìm test: packages/domain/src + packages/ui/src (tương thích bash 3.2 — không dùng mapfile)
FILES=$(find "$ROOT/packages/domain/src" "$ROOT/packages/ui/src" -name '*.test.ts' | sort)

if [[ -z "$FILES" ]]; then
  echo "⚠️  Không có file *.test.ts nào." >&2
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
echo "✅ test-domain: TẤT CẢ PASS."
exit 0
