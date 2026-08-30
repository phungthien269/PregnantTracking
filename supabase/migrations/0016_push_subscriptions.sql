-- 0016_push_subscriptions.sql — Web Push (R-notify): subscriptions per user.
-- Mỗi user có thể có nhiều thiết bị (mỗi endpoint = 1 thiết bị/nguyệt phiên SW).

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
create policy fam_select on public.push_subscriptions
  for select using (private_owner_id = auth.uid());
create policy fam_insert on public.push_subscriptions
  for insert with check (private_owner_id = auth.uid() and family_id in (select public.app_family_ids()));
create policy fam_delete on public.push_subscriptions
  for delete using (private_owner_id = auth.uid());
