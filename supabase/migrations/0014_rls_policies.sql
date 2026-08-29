-- 0014_rls_policies.sql — RLS hoàn chỉnh (cầu nối auth app ↔ Supabase).
-- Mô hình quyền giống tầng local (scope()):
--   1. Bảng có family_id: chỉ thấy/ghi dữ liệu của gia đình mình (qua family_members).
--   2. Bảng có private_owner_id: dòng riêng tư (private_owner_id = auth.uid()) chỉ chủ
--      sở hữu thấy; dòng dùng chung (NULL) cả gia đình thấy.
-- Lưu ý: app dùng auth riêng (bảng sessions) nhưng JWT Supabase được cấp khi login
-- (signInWithPassword trên auth.users seed cùng user_id) → auth.uid() khớp user_id.

-- Helper: các family_id của user hiện tại (security definer để bỏ qua RLS bảng trung gian).
create or replace function public.app_family_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select family_id from public.family_members where user_id = auth.uid()
$$;

DO $$
DECLARE
  t text;
  has_private boolean;
  fam_filter text := 'family_id in (select public.app_family_ids())';
  priv_filter text := '(private_owner_id is null or private_owner_id = auth.uid())';
BEGIN
  FOR t IN
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'family_id'
  LOOP
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'private_owner_id'
    ) into has_private;

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists fam_select on public.%I', t);
    execute format('drop policy if exists fam_insert on public.%I', t);
    execute format('drop policy if exists fam_update on public.%I', t);
    execute format('drop policy if exists fam_delete on public.%I', t);

    if has_private then
      execute format(
        'create policy fam_select on public.%I for select using (%s and %s)', t, fam_filter, priv_filter);
      execute format(
        'create policy fam_insert on public.%I for insert with check (%s and %s)', t, fam_filter, priv_filter);
      execute format(
        'create policy fam_update on public.%I for update using (%s and %s) with check (%s and %s)',
        t, fam_filter, priv_filter, fam_filter, priv_filter);
    else
      execute format('create policy fam_select on public.%I for select using (%s)', t, fam_filter);
      execute format('create policy fam_insert on public.%I for insert with check (%s)', t, fam_filter);
      execute format(
        'create policy fam_update on public.%I for update using (%s) with check (%s)', t, fam_filter, fam_filter);
    end if;
    execute format('create policy fam_delete on public.%I for delete using (%s)', t, fam_filter);
  END LOOP;

  -- families: thành viên thấy gia đình của mình.
  execute 'alter table public.families enable row level security';
  execute 'drop policy if exists fam_select on public.families';
  execute 'create policy fam_select on public.families for select using (id in (select public.app_family_ids()))';

  -- family_members: thấy thành viên của gia đình mình + membership của chính mình.
  execute 'alter table public.family_members enable row level security';
  execute 'drop policy if exists fam_select on public.family_members';
  execute $p$create policy fam_select on public.family_members for select
    using (user_id = auth.uid() or family_id in (select public.app_family_ids()))$p$;
END $$;
