create table if not exists public.system_flags (
  id int primary key,
  super_admin_created boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.system_flags (id, super_admin_created)
values (1, false)
on conflict (id) do nothing;

-- Solo el servidor (service role) debe acceder; anon/authenticated quedan bloqueados sin políticas.
alter table public.system_flags enable row level security;
