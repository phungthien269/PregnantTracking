# Supabase — hướng dẫn kết nối thật (PHASE 3)

Runbook từng bước để chuyển "Mẹ & Bé" từ demo (mock) sang backend Supabase thật.
Người dùng chưa có tài khoản → bắt đầu ở mục 0. Khi đã có key, mỗi mục dưới đây
là một lệnh chạy được, không cần sửa code.

> Đối chiếu: cách app đọc env nằm ở `apps/web/lib/supabase.ts` (client + quyết định
> mock/thật), `apps/web/lib/ai/client.ts` (`OPENROUTER_API_KEY`), `apps/web/inngest/client.ts`
> (`INGEST_KEY`/`INGEST_URL`). Kiểm tra nhanh: `node scripts/check-env.ts`.

---

## 0. Trước khi bắt đầu

- Yêu cầu: [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase --version`)
  — máy này chưa cài, cài bằng `brew install supabase/tap/supabase` (macOS) hoặc
  theo [docs](https://supabase.com/docs/guides/cli). Cần tài khoản [supabase.com](https://supabase.com).
  Optional: [openrouter.ai](https://openrouter.ai) (AI), [inngest.com](https://www.inngest.com) (notification).
- Repo chưa có `supabase/config.toml` — không bắt buộc cho `db push`/`link` (chỉ
  cần cho `supabase start` local; nếu dùng local, chạy `supabase init` để sinh).

## 1. Danh sách migrations (thứ tự áp dụng)

Chạy tuần tự `0001 → 0010` bằng `supabase db push` (cloud) hoặc `supabase db reset` (local).

| File | Nội dung |
|---|---|
| `0001_extensions_enums.sql` | extensions (`uuid-ossp`, `pg_trgm`, `vector`) + toàn bộ enum type + `set_updated_at()` |
| `0002_family_auth.sql` | `profiles`, `families`, `family_members`, `privacy_settings`, `consents`, `audit_events` |
| `0003_pregnancy.sql` | `pregnancies`, `fetuses`, `health_profiles`, `pregnancy_week_snapshots`, `maternal_measurements`, `symptom_reports`, `fetal_movement_logs`, `appointments`, `document_records`, `document_extractions` |
| `0004_nutrition.sql` | `nutrition_profiles`, `meal_entries`, `meal_photos`, `food_preferences`, `food_safety_flags`, `supplement_plans`, `supplement_adherence`, `condition_plans`, `condition_measurements`, `saved_meals` |
| `0005_postpartum.sql` | `birth_records`, `children`, `feeding_logs`, `sleep_logs`, `diaper_logs`, `growth_measurements`, `milestones`, `vaccinations`, `child_medications` |
| `0006_coordination.sql` | `tasks`, `checklists`, `shopping_items`, `budget_entries`, `reminders`, `notification_preferences` |
| `0007_content_ai.sql` | `content_sources`, `articles`, `weekly_guides`, `alert_rules`, `content_versions`, `chat_sessions`, `chat_messages`, `ai_consents`, `knowledge_sources`, `knowledge_chunks`, `knowledge_stage_tags`, `quiz_sets`, `quiz_questions`, `quiz_attempts`, `question_reports` |
| `0008_rls_indexes.sql` | helper `is_family_member()` / `can_access_row()` / `handle_new_family()` + trigger tạo `family_members`/`privacy_settings` khi thêm family + **bật RLS + policy** cho toàn bộ bảng + index |
| `0009_hydration_caffeine.sql` | `hydration_logs`, `caffeine_logs` (+ RLS chuẩn family/private_owner) |
| `0010_articles_source_version.sql` | `articles` thêm cột `source text`, `version int default 1` |

### Bảng được seed sẵn (seed.sql) — không cần nhập tay

`profiles`, `families`, `family_members`, `privacy_settings`, `pregnancies`,
`fetuses`, `health_profiles`, `maternal_measurements`, `fetal_movement_logs`,
`symptom_reports`, `appointments`, `document_records`, `meal_entries`,
`supplement_plans`, `tasks`, `shopping_items`, `budget_entries`, `reminders`,
`articles`, `weekly_guides`, `quiz_sets`, `quiz_questions`, `birth_records`,
`children`, `feeding_logs`, `sleep_logs`, `diaper_logs`, `growth_measurements`,
`milestones`, `vaccinations` + 2 user `auth.users` demo (`me@demo.vi` / `bo@demo.vi`,
mật khẩu `demo123456`, email domain giả `@demo.vi`).

Các bảng còn lại (vd `meal_photos`, `hydration_logs`, `chat_messages`, `knowledge_chunks`,
`checklists`, …) do app ghi khi người dùng dùng tính năng — không cần seed.

## 2. Kết nối Cloud (khuyến nghị chính)

```bash
cd code

# 2.1. Tạo project trên supabase.com → Dashboard → New project.
#     Ghi lại: Project URL + anon key + service role key (Settings → API).

# 2.2. Link project local → remote
supabase link --project-ref <project-ref>    # ref lấy từ URL dự án: supabase.co/project/<ref>

# 2.3. Áp migrations 0001–0010
supabase db push

# 2.4. Seed dữ liệu demo (1 gia đình Việt + 2 tài khoản @demo.vi)
#     Cloud: dán toàn bộ nội dung supabase/seed/seed.sql vào SQL Editor rồi Run.
#     (seed dùng `set session_replication_role = 'replica'` → cần chạy với quyền
#      postgres; SQL Editor của Supabase chạy với quyền đó.)

# 2.5. Tạo storage bucket + policy (mục 4) rồi tạo user thật (mục 5).
```

## 3. Kết nối Local (Supabase CLI + Docker, thử nghiệm nhanh)

```bash
cd code
supabase init         # sinh supabase/config.toml (nếu chưa có)
supabase start        # dựng postgres + services; in URL + key local
supabase db reset     # áp migrations 0001–0010; seed chạy tự động nếu CLI nhận seed
# sau đó vẫn cần tạo bucket (mục 4) + user (mục 5) nếu muốn đăng nhập thật.
```

`supabase db reset` xóa toàn bộ data rồi chạy lại migrations + seed — chỉ dùng ở
môi trường local. Lưu ý seed của repo ở `supabase/seed/seed.sql` (CLI mặc định tìm
`supabase/seed.sql`): nếu sau `db reset` chưa có dữ liệu demo, chạy thủ công
`psql "$DATABASE_URL" -f supabase/seed/seed.sql` hoặc dán vào SQL Editor.

## 4. Storage bucket (ảnh bữa ăn + tài liệu)

`meal_photos.file_url` và `document_records.file_url` trỏ tới file trong storage.
Chưa có bucket nào được tạo trong migration — chạy SQL này một lần (SQL Editor,
hoặc sau `supabase link`):

```sql
-- 4.1. Tạo bucket (private)
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false),
       ('documents',  'documents',  false)
on conflict (id) do nothing;

-- 4.2. Policy mặc định: mọi user authenticated trong project đều đọc/ghi được
--      (dự án chỉ có 2 thành viên gia đình — đủ dùng).
-- ponytail: policy rộng theo bucket; khi có nhiều gia đình → chia folder
-- `family_id/...` trong đường dẫn rồi siết policy bằng `storage.foldername(name)`.
create policy "meal_photos_all_authenticated" on storage.objects
  for all to authenticated
  using (bucket_id = 'meal-photos')
  with check (bucket_id = 'meal-photos');

create policy "documents_all_authenticated" on storage.objects
  for all to authenticated
  using (bucket_id = 'documents')
  with check (bucket_id = 'documents');
```

## 5. Tạo user + kiểm tra RLS

App **chưa có trang đăng nhập/đăng ký** (scope ADR) — tạo user qua Dashboard:

1. Supabase Dashboard → Authentication → Users → **Add user** → email + password.
2. User mới chưa có `profiles`/`family`. Tạo qua SQL Editor (thay `<USER_ID>` bằng
   UUID vừa tạo). Dùng `set session_replication_role = 'replica'` để **tắt trigger**
   `on_family_created` — trigger này tự gán `user_id = auth.uid()`, mà SQL Editor
   không có `auth.uid()` (null) nên sẽ fail do cột `not null`; khi tắt trigger ta
   tự gán `user_id` cho đúng:

```sql
set session_replication_role = 'replica';   -- tạm tắt trigger (cần quyền postgres)

insert into public.profiles (id, full_name)
values ('<USER_ID>', 'Tên hiển thị');

with fam as (
  insert into public.families (name) values ('Gia đình tôi') returning id
), mem as (
  insert into public.family_members (family_id, user_id, role)
  select id, '<USER_ID>', 'owner' from fam returning family_id
)
insert into public.privacy_settings (family_id)
select family_id from mem;

set session_replication_role = 'origin';    -- bật lại trigger
```

> Muốn dùng đúng trigger có sẵn thay vì tắt nó: đăng nhập vào app (khi đã có trang
> đăng nhập) rồi tạo family từ trong app — trigger tự thêm owner + privacy_settings.

3. Kiểm tra RLS — chạy với đúng user đã đăng nhập, dùng SQL Editor:
   - `select * from public.families;` → chỉ thấy family của mình.
   - `select public.is_family_member('<FAMILY_ID>');` → `true` nếu là thành viên.
   - Thử đọc bảng người khác → 0 dòng (RLS chặn, không trả lỗi).

> Mẹo: seed sẵn 2 tài khoản demo `me@demo.vi` / `bo@demo.vi` (mk `demo123456`).
> Muốn chạy app thật ngay, đăng nhập bằng tài khoản demo trên Dashboard.

## 6. Gắn env vào app

```bash
cp apps/web/.env.example apps/web/.env.local
# điền NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (bắt buộc),
# SUPABASE_SERVICE_ROLE_KEY (server-only, cho seed/admin — tùy chọn),
# OPENROUTER_API_KEY, INGEST_KEY, INGEST_URL (tùy chọn → mock/fallback nếu thiếu).

node scripts/check-env.ts     # xác nhận trạng thái từng biến
pnpm dev                      # có đủ 2 biến Supabase → app chuyển backend thật
```

## 7. Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Xử lý |
|---|---|---|
| `supabase link` báo project không tồn tại | Thiếu `supabase/login` hoặc sai ref | `supabase login` trước; ref lấy từ URL dashboard |
| `supabase db push` lỗi `relation does not exist` | Push thiếu/trễ migration | Push lại từ đầu project mới (đảm bảo đủ 10 file) |
| Seed lỗi quyền `session_replication_role` | User không phải superuser | Dùng SQL Editor (postgres) hoặc chạy local `supabase db reset` |
| App vẫn chạy mock dù đã điền env | Thiếu 1 trong 2 biến URL/ANON | `node scripts/check-env.ts` xem biến nào THIẾU |
| Upload ảnh lỗi 403 | Chưa tạo bucket/policy (mục 4) | Chạy SQL mục 4 |
| Login Dashboard không vào được | User chưa có profile/family | Chạy SQL mục 5 |
