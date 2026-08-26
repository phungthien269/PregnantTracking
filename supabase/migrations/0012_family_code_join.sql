-- 0012: mã mời gia đình + tham gia bằng mã mời.
--   - Thêm cột `families.code` (unique, nullable) — mã mời 6 ký tự, không nhập nhằng.
--   - Hàm security definer `join_family(code)` để thành viên MỚI tự thêm vào gia đình
--     theo mã mời (RLS `family_members_insert` chặn người chưa là thành viên).
begin;

-- ---- Cột mã mời ----
alter table public.families
  add column if not exists code text;

-- Unique trên upper(code) (cho phép nhiều NULL) — mã mời không phân biệt hoa/thường.
create unique index if not exists families_code_upper_key
  on public.families (upper(code)) where code is not null;

-- ---- Hàm tham gia gia đình theo mã mời ----
-- security definer: chạy với quyền của hàm (bypass RLS family_members_insert) để
-- member mới tự thêm được; vẫn kiểm tra auth.uid() khác null.
create or replace function public.join_family(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;
  v_code := upper(btrim(coalesce(code, '')));
  if v_code = '' then
    return null;
  end if;

  select f.id into fid
  from public.families f
  where upper(f.code) = v_code
  limit 1;

  if fid is null then
    return null;
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (fid, auth.uid(), 'member')
  on conflict (family_id, user_id) do nothing;

  return fid;
end;
$$;

revoke execute on function public.join_family(text) from public;
grant execute on function public.join_family(text) to authenticated;

commit;
