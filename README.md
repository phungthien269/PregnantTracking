# Mẹ & Bé

Web app thai kỳ, dinh dưỡng và chăm bé cho gia đình Việt — monorepo TypeScript.

Đồng hành từ mang thai (tuần thai, dinh dưỡng, triệu chứng, lịch khám) đến sau sinh
và chăm bé 0–24 tháng (bú, ngủ, tã, tăng trưởng, mốc phát triển, tiêm chủng), kèm
điều phối gia đình (task, mua sắm, ngân sách, reminder) và thư viện học cùng con
(import PDF/EPUB/URL, quiz, hỏi đáp). UI tiếng Việt có dấu, WCAG AA, dark mode +
5 accent tùy chỉnh. Chi tiết sản phẩm: [`outputs/implementation-plan.md`](../outputs/implementation-plan.md).

> Tài liệu kỹ thuật: kiến trúc, API ref, runbook, checklist nghiệm thu tại `orchestration/docs/`.
> Trạng thái: **Phase 1–3 đã xong** (web hoàn chỉnh, chạy demo; backend Supabase
> sẵn sàng khi cấu hình env — xem `supabase/README.md`). Tiến độ: `orchestration/status/project.md`.

## Nhanh

```bash
pnpm install
pnpm dev          # web ở http://localhost:3000
pnpm typecheck    # tsc toàn repo (turbo)
pnpm build        # next build (turbo)
```

Yêu cầu: Node ≥ 20, pnpm ≥ 11 (bản đang dùng: `pnpm@11.17.0`).

Chưa có env Supabase → app chạy **chế độ demo** với dữ liệu mock tiếng Việt (qua
interface `DataApi`). Có env Supabase → cùng interface đó dùng backend thật. Không
cần cấu hình gì để chạy thử.

## Kiểm tra

| Lệnh | Việc |
|---|---|
| `./scripts/test-domain.sh` | Chạy bộ test domain/ui (61 test / 6 file, không cần vitest) |
| `node scripts/check-env.ts` | Kiểm tra biến môi trường: biến nào OK/THIẾU, app chạy mock hay thật (exit 0 kể cả khi thiếu) |
| `./scripts/smoke.sh` | Chưa có — smoke test hiện chạy thủ công (mục Smoke test bên dưới) |

Từ thư mục `code/`:

```bash
./scripts/test-domain.sh        # PASS 6 file / 61 test, exit 0
node scripts/check-env.ts       # in bảng 7 biến + tóm tắt MOCK/THẬT
```

## Cấu trúc

```
apps/web          Next.js App Router (web responsive)
apps/ios          SwiftUI companion (source + guide — cần Xcode, xem phần iOS)
packages/domain   Zod schemas + business rules (thuần, không phụ thuộc React)
packages/ui       Design tokens + component primitives
supabase/         Migrations + seed (PostgreSQL, RLS) + README kết nối thật
scripts/          test-domain.sh (test), check-env.ts (kiểm tra env)
```

Chi tiết:

| Đường dẫn | Nội dung |
|---|---|
| `packages/domain/src/core.ts` | Enum chuẩn + type nền (khế ước dùng chung, bất biến) |
| `packages/domain/src/<module>/` | Schema Zod từng nhóm (family, pregnancy, nutrition, postpartum, coordination, content, ai) |
| `packages/ui/src/tokens.css\|ts` | Design tokens (màu, radius, shadow, accent, dark mode) |
| `packages/ui/src/components/` | UI primitives (Button, Card, Badge, Input, …) |
| `apps/web/app/**` | Pages (App Router); `app/api/**` là route handler `/api/v1` |
| `apps/web/app/manifest.ts` + `public/sw.js` | PWA: manifest + service worker offline (production) |
| `apps/web/components/**` | Client components cấp app |
| `apps/web/lib/data/api.ts` | Interface `DataApi` (seam backend ↔ frontend, bất biến) |
| `apps/web/lib/data/mock.ts` | DataApi mock + seed (chế độ demo) |
| `apps/web/lib/data/supabase.ts` | DataApi backend thật |
| `apps/web/lib/data/index.ts` | Resolver: chọn mock / supabase theo env |
| `apps/web/lib/ai/` | Gateway OpenRouter (chat, insight, quiz-gen, symptom-triage, sources) |
| `apps/web/lib/library/` | Import PDF/EPUB/URL → chunk → stage → citations → quiz |
| `apps/web/lib/meals-photo/` | Ảnh bữa ăn → nhận diện (AI/heuristic) → đề xuất |
| `apps/web/lib/ocr/` | OCR chỉ số khám (regex + seam vision AI) |
| `apps/web/lib/health-sync.ts` | Đồng bộ HealthKit (iOS), dedupe theo epoch |
| `apps/web/lib/question-reports.ts` | Báo lỗi câu hỏi quiz (mock + Supabase RLS) |
| `apps/web/lib/inngest/` | Notification seam (Inngest HTTP hoặc fallback in-app) |
| `apps/web/middleware.ts` | Rate-limit (30/60/120) + CSRF origin-check cho `/api/v1/*` |
| `apps/web/next.config.ts` | CSP + security headers |
| `supabase/migrations/*.sql` | Schema + RLS (10 migrations `0001`–`0010`) |
| `supabase/seed/seed.sql` | Seed SQL + 2 tài khoản demo (`me@demo.vi` / `bo@demo.vi`) |
| `supabase/README.md` | **Runbook kết nối thật từng bước** (db push, seed, bucket, user, RLS check) |

Convention: alias `@/*` → `apps/web/*`; mọi bảng gia đình có `family_id`, mục riêng
có `private_owner_id`; API trả `{ data }` hoặc `{ error: { code, message, details } }`;
input biên giới validate bằng Zod.

## Tính năng chính

- **AI (OpenRouter)**: hỏi đáp, phân tích triệu chứng (triage cứng trước), sinh quiz
  từ nội dung import. Không có key → fallback nội dung nguồn / heuristic, app không lỗi.
- **Thư viện học cùng con**: import PDF/EPUB/URL → chunk + citations → stage tags → sinh quiz.
- **Ảnh bữa ăn**: tải ảnh → AI nhận diện (hoặc heuristic theo tên file) → trả đề xuất
  để **xác nhận trước khi lưu** (confirm-before-save).
- **OCR chỉ số khám**: chụp/dán tờ khám → trích số đo → xác nhận → ghi biểu đồ (2 bước).
- **Báo lỗi quiz**: mỗi câu hỏi có nút báo lỗi → `question_reports` + route moderation.
- **Health-sync**: đồng bộ HealthKit từ iOS, dedupe không ghi đè dữ liệu nhập tay.
- **Notification**: nhắc lịch khám/task/mốc tuần/reminder; Inngest seam + fallback in-app.
- **Export & quyền riêng tư**: xuất CSV/PDF, xoá toàn bộ dữ liệu gia đình.
- **PWA offline**: manifest + service worker, offline shell 8 trang chính (production).
- **Bảo mật**: CSP + security headers, rate-limit 30/60/120, CSRF origin-check, RLS.
- **WCAG AA**: audit + fix (tương phản, focus trap, bàn phím/ARIA, skip-link).

## Cấu hình backend thật (Supabase)

Làm theo **`supabase/README.md`** — runbook từng bước: cài Supabase CLI → tạo
project → `supabase link` + `db push` (migrations 0001–0010) → seed → tạo storage
bucket (`meal-photos`, `documents`) → tạo user → điền env → kiểm tra.

Tóm tắt:

```bash
# 1. Tạo project tại supabase.com; lấy URL + anon key (Settings → API).
# 2. Áp migrations + seed:
supabase link --project-ref <ref>
supabase db push                    # migrations 0001–0010
#    seed: dán supabase/seed/seed.sql vào SQL Editor (hoặc db reset local)
# 3. Tạo bucket + policy (mục 4 supabase/README.md), tạo user (mục 5).
# 4. Gắn env vào app:
cp apps/web/.env.example apps/web/.env.local
#    điền NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (bắt buộc);
#    SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY, INGEST_KEY/INGEST_URL (tùy chọn → fallback)
node scripts/check-env.ts           # xác nhận trạng thái từng biến
pnpm dev
```

Có đủ 2 biến Supabase → app bỏ chế độ demo, dùng backend thật (kiểm tra `dataMode`
trong `lib/data/index.ts`). Thiếu key → app vẫn chạy mock/fallback, không lỗi.

## Các lệnh

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Chạy web ở http://localhost:3000 |
| `pnpm build` | Build toàn monorepo (Next) |
| `pnpm typecheck` | Typecheck toàn repo (turbo) |
| `pnpm lint` | Lint toàn repo |
| `./scripts/test-domain.sh` | Bộ test domain/ui (61 test, không cần vitest) |
| `node scripts/check-env.ts` | Kiểm tra biến môi trường mock/thật |

`pnpm install` đã được orchestrator lo — không cần `pnpm add` dependency mới ngoài
danh sách đã cài (zod, react, next, recharts, date-fns, clsx, tailwind-merge,
@supabase/supabase-js).

## Smoke test (thủ công)

Chưa có `scripts/smoke.sh` tự động — cách hiện tại:

1. `pnpm build && pnpm start` (hoặc `pnpm dev`) với server ở cổng riêng.
2. Gọi thử các route chính: `/`, `/manifest.webmanifest`, `/sw.js`,
   `GET /api/v1/notifications`, `POST /api/v1/health-sync`, `POST /api/v1/measurements/ocr`,
   `POST /api/v1/meals/photo`, `POST /api/v1/quizzes/report`, `GET /api/v1/question-reports`.
3. Lưu ý middleware: mutation có `Origin` lệch Host → **403**; vượt ngưỡng rate-limit
   → **429** (AI 30/phút, mutation 60/phút, read 120/phút).
4. Tham chiếu route đầy đủ: `orchestration/docs/api-reference.md`.

## Phạm vi (theo ADR-004)

Không xây: bộ đếm cơn gò, ứng dụng Android, đặt lịch bệnh viện trực tiếp, chia sẻ
thư viện ra công khai. Chỉ hai vợ chồng (2 tài khoản) truy cập dữ liệu gia đình.

## iOS

`apps/ios` có source SwiftUI hoàn chỉnh (Agent 8): auth/Keychain/biometric,
dashboard, ghi nhanh offline (mã hóa AES-GCM), HealthKit 2 chiều, push — kèm
`README.md` + `project.yml` (xcodegen). Để chạy trên máy có Xcode:

```bash
cd apps/ios
xcodegen generate
open Mevabe.xcodeproj     # chọn simulator rồi Run
```

Chưa có Xcode → code iOS vẫn typecheck bằng `swiftc -typecheck` (đã chạy exit 0);
phần HealthKit/push cần device thật khi test.
