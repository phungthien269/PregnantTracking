#!/usr/bin/env bash
# ===========================================================================
# scripts/supabase-provision.sh — dựng dữ liệu demo trên project Supabase mới.
#
# Quy trình (đã chốt sau sự cố 2026-08-29 — KHÔNG seed auth.users bằng SQL raw,
# INSERT thủ công vào auth.* làm GoTrue lỗi "Database error querying schema"):
#   1. Migration: supabase db push (13 migration + 0014 RLS policies).
#   2. User demo: tạo qua Admin API (GoTrue tự sinh id + identities chuẩn).
#   3. Seed dữ liệu public: seed/seed.sql (KHÔNG còn auth.users).
#   4. Ánh xạ id user cũ (hardcode trong seed) → id GoTrue vừa sinh.
#
# Dùng: SUPABASE_PROJECT_REF=xxx SUPABASE_DB_URL=postgresql://... bash scripts/supabase-provision.sh
# Env server cần có trong apps/web/.env.local:
#   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
# ===========================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPA="$ROOT/supabase"
REF="${SUPABASE_PROJECT_REF:?Thiếu SUPABASE_PROJECT_REF}"
DBURL="${SUPABASE_DB_URL:?Thiếu SUPABASE_DB_URL (session pooler, role postgres)}"
SK="${SUPABASE_SERVICE_ROLE_KEY:?Thiếu SUPABASE_SERVICE_ROLE_KEY}"
PSQL="${PSQL:-psql}"
API="https://$REF.supabase.co/auth/v1"

step() { echo "── $1"; }

step "2. Tạo user demo qua Admin API (idempotent)"
mk_user() { # email password name → in id (uuid) ra stdout
  local email="$1" pw="$2" name="$3"
  local id
  id=$(curl -sf "$API/admin/users?per_page=50" -H "apikey: $SK" -H "Authorization: Bearer $SK" \
    | python3 -c "import json,sys;us=json.load(sys.stdin)['users'];print(next((u['id'] for u in us if u.get('email')=='$email'),''))") || true
  if [[ -z "$id" ]]; then
    id=$(curl -sf -X POST "$API/admin/users" -H "apikey: $SK" -H "Authorization: Bearer $SK" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$pw\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"$name\"}}" \
      | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
  fi
  echo "$id"
}
U1=$(mk_user "me@demo.vn" "demo1234" "Mẹ")
U2=$(mk_user "bo@demo.vn" "demo1234" "Bố")
echo "   me@demo.vn → $U1"
echo "   bo@demo.vn → $U2"

step "3. Seed dữ liệu public (xóa dữ liệu cũ → nạp seed)"
$PSQL "$DBURL" <<'SQL'
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('truncate table public.%I cascade', t.tablename);
  end loop;
end $$;
SQL
$PSQL "$DBURL" -v ON_ERROR_STOP=1 -f "$SUPA/seed/seed.sql"

step "4. Ánh xạ id user cũ trong seed → id GoTrue"
$PSQL "$DBURL" <<SQL
do \$\$
declare r record;
begin
  for r in
    select c.table_schema sch, c.table_name tbl, c.column_name col
    from information_schema.columns c
    where c.table_schema='public' and c.data_type='uuid'
  loop
    begin
      execute format('update %I.%I set %I = %L::uuid where %I::text = %L', r.sch, r.tbl, r.col, '$U1', r.col, '10000000-0000-0000-0000-000000000002');
      execute format('update %I.%I set %I = %L::uuid where %I::text = %L', r.sch, r.tbl, r.col, '$U2', r.col, '10000000-0000-0000-0000-000000000003');
    exception when others then
      raise warning 'bo qua %.%: %', r.tbl, r.col, sqlerrm;
    end;
  end loop;
end \$\$;
SQL

step "5. Verify"
$PSQL "$DBURL" -c "select (select count(*) from public.family_members) as family_members,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.pregnancies) as pregnancies,
  (select count(*) from public.children) as children,
  (select count(*) from public.meal_entries) as meals,
  (select count(*) from public.tasks) as tasks;"

echo "✅ Provision xong — login me@demo.vn / demo1234 để kiểm chứng end-to-end."
