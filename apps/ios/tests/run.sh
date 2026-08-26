#!/usr/bin/env bash
# Chạy test logic thuần của app iOS Mẹ & Bé bằng `swift` CLI — KHÔNG cần Xcode.
#
# Compile trực tiếp SOURCE THẬT (Foundation-only) của app:
#   MeVaBe/Core/WeekCalculator.swift, MeVaBe/Core/Models/Enums.swift, Entities.swift
# + bản sao PendingRequest.swift (phần thuần của OfflineQueue).
# Exit 0 = PASS; exit 1 = có test lỗi (in dòng [FAIL]).
set -euo pipefail
cd "$(dirname "$0")"

SRC="../MeVaBe"
BIN=".build/mevabe_tests"
mkdir -p .build

echo "== Mẹ & Bé — iOS tests (swift CLI, không cần Xcode) =="
echo "Compile source thật + test..."
swiftc -o "$BIN" main.swift PendingRequest.swift \
  "$SRC/Core/WeekCalculator.swift" \
  "$SRC/Core/Models/Enums.swift" \
  "$SRC/Core/Models/Entities.swift"

echo "Run..."
set +e
"$BIN"
code=$?
set -e
echo "== run.sh kết thúc: exit $code (0 = PASS) =="
exit $code
