-- 0006: điều phối gia đình — tasks, checklists, shopping_items, budget_entries,
-- reminders, notification_preferences.
begin;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  due_date date,
  assignee_id uuid,
  completed_at timestamptz,
  reminder_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_family_status_idx on public.tasks (family_id, status);
create index tasks_due_date_idx on public.tasks (due_date);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  title text not null,
  completed boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index checklists_task_idx on public.checklists (task_id);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  name text not null,
  category text,
  quantity numeric,
  unit text,
  estimated_price numeric,
  actual_price numeric,
  status public.shopping_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shopping_items_family_idx on public.shopping_items (family_id, status);

create table public.budget_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  title text not null,
  amount numeric not null check (amount >= 0),
  type public.budget_type not null,
  category text,
  occurred_at date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index budget_entries_family_idx on public.budget_entries (family_id, occurred_at);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  title text not null,
  scheduled_at timestamptz not null,
  frequency public.reminder_frequency not null default 'once',
  channels public.notification_channel[] not null default '{in_app}',
  active boolean not null default true,
  last_sent_at timestamptz,
  payload text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reminders_scheduled_at_idx on public.reminders (scheduled_at);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  "group" public.notification_group not null,
  channel public.notification_channel not null,
  enabled boolean not null default true,
  quiet_start time,
  quiet_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notification_preferences_family_idx on public.notification_preferences (family_id, "group");

do $$
declare t text;
begin
  foreach t in array array[
    'tasks', 'checklists', 'shopping_items', 'budget_entries', 'reminders',
    'notification_preferences'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

commit;
