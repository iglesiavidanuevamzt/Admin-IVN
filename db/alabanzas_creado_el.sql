-- Columna para ordenar alabanzas por las más recientes primero
-- Ejecutar en Supabase → SQL Editor (una sola vez)

alter table public.alabanzas
  add column if not exists creado_el timestamptz not null default now();

update public.alabanzas
set creado_el = now()
where creado_el is null;
