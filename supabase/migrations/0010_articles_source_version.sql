-- 0010: articles — thêm nguồn trích dẫn + phiên bản nội dung
-- (nguồn trước đây để ở cuối body; updated_at đã có từ migration 0007).
begin;

alter table public.articles
  add column source text,
  add column version int not null default 1;

commit;
