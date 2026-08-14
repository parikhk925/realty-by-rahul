create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.staff_role as enum ('admin', 'agent');
create type public.site_visit_status as enum (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null default '',
  whatsapp text not null default '',
  avatar_url text,
  role public.staff_role not null default 'agent',
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.developers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (
    lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
  ) stored,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (normalized_name)
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (
    lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
  ) stored,
  emirate text not null default 'Dubai',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (normalized_name, emirate)
);

create table public.properties (
  id text primary key,
  slug text not null unique,
  title text not null,
  status text not null default 'Draft' check (status in ('Live', 'Draft')),
  purpose text not null check (purpose in ('For Sale', 'For Rent')),
  category text not null check (category in ('Off-plan', 'Secondary', 'Rent')),
  developer_id uuid references public.developers(id) on delete set null,
  community_id uuid references public.communities(id) on delete set null,
  assigned_agent_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.properties(id) on delete cascade,
  kind text not null check (kind in ('brochure', 'floor_plan')),
  name text not null,
  url text not null,
  created_at timestamptz not null default now(),
  unique (property_id, kind)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  assigned_agent_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.property_shares (
  id uuid primary key default gen_random_uuid(),
  property_id text references public.properties(id) on delete set null,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_phone text not null,
  created_at timestamptz not null default now()
);

create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  property_id text not null references public.properties(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  scheduled_at timestamptz not null,
  status public.site_visit_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_visit_targets (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  target_count integer not null check (target_count > 0),
  created_at timestamptz not null default now(),
  unique (agent_id, period_start, period_end),
  check (period_end >= period_start)
);

create index properties_status_idx on public.properties(status);
create index properties_agent_idx on public.properties(assigned_agent_id);
create index properties_developer_idx on public.properties(developer_id);
create index properties_community_idx on public.properties(community_id);
create index site_visits_agent_scheduled_idx
  on public.site_visits(agent_id, scheduled_at desc);
create index shares_agent_created_idx
  on public.property_shares(agent_id, created_at desc);

create or replace function private.current_staff_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and is_active = true
  );
$$;

create or replace function private.current_staff_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_active = true
  );
$$;

revoke all on function private.current_staff_is_admin() from public;
revoke all on function private.current_staff_is_active() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_staff_is_admin() to authenticated;
grant execute on function private.current_staff_is_active() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger properties_updated_at
before update on public.properties
for each row execute function private.set_updated_at();

create trigger customers_updated_at
before update on public.customers
for each row execute function private.set_updated_at();

create trigger site_visits_updated_at
before update on public.site_visits
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.developers enable row level security;
alter table public.communities enable row level security;
alter table public.properties enable row level security;
alter table public.property_documents enable row level security;
alter table public.customers enable row level security;
alter table public.property_shares enable row level security;
alter table public.site_visits enable row level security;
alter table public.site_visit_targets enable row level security;

create policy "staff can read permitted profiles"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_staff_is_admin())
);

create policy "active staff can read directories"
on public.developers for select
to authenticated
using ((select private.current_staff_is_active()));

create policy "active staff can create developers"
on public.developers for insert
to authenticated
with check (
  (select private.current_staff_is_active())
  and created_by = (select auth.uid())
);

create policy "active staff can read communities"
on public.communities for select
to authenticated
using ((select private.current_staff_is_active()));

create policy "active staff can create communities"
on public.communities for insert
to authenticated
with check (
  (select private.current_staff_is_active())
  and created_by = (select auth.uid())
);

create policy "public can read live properties"
on public.properties for select
to anon
using (status = 'Live');

create policy "staff can read owned properties"
on public.properties for select
to authenticated
using (
  (select private.current_staff_is_admin())
  or (
    (select private.current_staff_is_active())
    and (
      assigned_agent_id = (select auth.uid())
      or created_by = (select auth.uid())
    )
  )
);

create policy "staff can create owned properties"
on public.properties for insert
to authenticated
with check (
  (select private.current_staff_is_active())
  and (
    (select private.current_staff_is_admin())
    or (
      created_by = (select auth.uid())
      and (
        assigned_agent_id is null
        or assigned_agent_id = (select auth.uid())
      )
    )
  )
);

create policy "staff can update owned properties"
on public.properties for update
to authenticated
using (
  (select private.current_staff_is_admin())
  or (
    (select private.current_staff_is_active())
    and assigned_agent_id = (select auth.uid())
  )
)
with check (
  (select private.current_staff_is_admin())
  or (
    (select private.current_staff_is_active())
    and assigned_agent_id = (select auth.uid())
  )
);

create policy "staff can delete owned properties"
on public.properties for delete
to authenticated
using (
  (select private.current_staff_is_admin())
  or (
    (select private.current_staff_is_active())
    and assigned_agent_id = (select auth.uid())
  )
);

create policy "public can read live property documents"
on public.property_documents for select
to anon
using (
  exists (
    select 1 from public.properties
    where properties.id = property_documents.property_id
      and properties.status = 'Live'
  )
);

create policy "staff can read permitted property documents"
on public.property_documents for select
to authenticated
using (
  exists (
    select 1 from public.properties
    where properties.id = property_documents.property_id
  )
);

create policy "staff can manage permitted property documents"
on public.property_documents for all
to authenticated
using (
  exists (
    select 1 from public.properties
    where properties.id = property_documents.property_id
  )
)
with check (
  exists (
    select 1 from public.properties
    where properties.id = property_documents.property_id
  )
);

create policy "staff can read owned customers"
on public.customers for select
to authenticated
using (
  (select private.current_staff_is_admin())
  or (
    (select private.current_staff_is_active())
    and assigned_agent_id = (select auth.uid())
  )
);

create policy "staff can create owned customers"
on public.customers for insert
to authenticated
with check (
  (select private.current_staff_is_active())
  and (
    (select private.current_staff_is_admin())
    or assigned_agent_id = (select auth.uid())
  )
);

create policy "staff can update owned customers"
on public.customers for update
to authenticated
using (
  (select private.current_staff_is_admin())
  or assigned_agent_id = (select auth.uid())
)
with check (
  (select private.current_staff_is_admin())
  or assigned_agent_id = (select auth.uid())
);

create policy "staff can read owned shares"
on public.property_shares for select
to authenticated
using (
  (select private.current_staff_is_admin())
  or (
    (select private.current_staff_is_active())
    and agent_id = (select auth.uid())
  )
);

create policy "staff can log owned shares"
on public.property_shares for insert
to authenticated
with check (
  (select private.current_staff_is_active())
  and agent_id = (select auth.uid())
);

create policy "staff can read owned visits"
on public.site_visits for select
to authenticated
using (
  (select private.current_staff_is_admin())
  or (
    (select private.current_staff_is_active())
    and agent_id = (select auth.uid())
  )
);

create policy "staff can create owned visits"
on public.site_visits for insert
to authenticated
with check (
  (select private.current_staff_is_active())
  and agent_id = (select auth.uid())
);

create policy "staff can update owned visits"
on public.site_visits for update
to authenticated
using (
  (select private.current_staff_is_admin())
  or agent_id = (select auth.uid())
)
with check (
  (select private.current_staff_is_admin())
  or agent_id = (select auth.uid())
);

create policy "staff can delete owned visits"
on public.site_visits for delete
to authenticated
using (
  (select private.current_staff_is_admin())
  or agent_id = (select auth.uid())
);

create policy "staff can read relevant targets"
on public.site_visit_targets for select
to authenticated
using (
  (select private.current_staff_is_admin())
  or (
    (select private.current_staff_is_active())
    and agent_id = (select auth.uid())
  )
);

create policy "admins can manage targets"
on public.site_visit_targets for all
to authenticated
using ((select private.current_staff_is_admin()))
with check ((select private.current_staff_is_admin()));

grant select on public.profiles to authenticated;
grant select, insert on public.developers to authenticated;
grant select, insert on public.communities to authenticated;
grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant select on public.property_documents to anon;
grant select, insert, update, delete on public.property_documents to authenticated;
grant select, insert, update on public.customers to authenticated;
grant select, insert on public.property_shares to authenticated;
grant select, insert, update, delete on public.site_visits to authenticated;
grant select, insert, update, delete on public.site_visit_targets to authenticated;
