-- 0015_storage_buckets.sql — Storage buckets + policy (hoàn tất nốt thiếu sót
-- "bộ chứa ảnh"): meal-photos (ảnh bữa ăn — code đã dùng), documents (hồ sơ khám —
-- dùng cho upload tài liệu sau). Bucket PUBLIC: đọc qua public URL (img src),
-- ghi/xoá chỉ cho user đã đăng nhập (JWT từ cầu auth app).

insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = excluded.public;

-- Policy: user đăng nhập upload/quản lý file trong bucket app; đọc công khai qua
-- public URL (bucket public). Cách ly theo gia đình hiện do tầng server thực hiện
-- (mọi upload đi qua route handler — client không đụng storage trực tiếp).
drop policy if exists "auth_select_app_buckets" on storage.objects;
drop policy if exists "auth_insert_app_buckets" on storage.objects;
drop policy if exists "auth_update_app_buckets" on storage.objects;
drop policy if exists "auth_delete_app_buckets" on storage.objects;

create policy "auth_select_app_buckets" on storage.objects
  for select to authenticated
  using (bucket_id in ('meal-photos', 'documents'));

create policy "auth_insert_app_buckets" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('meal-photos', 'documents'));

create policy "auth_update_app_buckets" on storage.objects
  for update to authenticated
  using (bucket_id in ('meal-photos', 'documents'))
  with check (bucket_id in ('meal-photos', 'documents'));

create policy "auth_delete_app_buckets" on storage.objects
  for delete to authenticated
  using (bucket_id in ('meal-photos', 'documents'));
