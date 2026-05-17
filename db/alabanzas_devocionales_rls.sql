-- Políticas RLS: alabanzas + devocionales
-- Ejecutar en Supabase → SQL Editor (una sola vez)

-- =============================================================================
-- ALABANZAS
-- =============================================================================

alter table public.alabanzas enable row level security;

drop policy if exists "alabanzas_select_authenticated" on public.alabanzas;
drop policy if exists "alabanzas_insert_authenticated" on public.alabanzas;
drop policy if exists "alabanzas_update_authenticated" on public.alabanzas;
drop policy if exists "alabanzas_delete_authenticated" on public.alabanzas;

create policy "alabanzas_select_authenticated"
  on public.alabanzas
  for select
  to authenticated
  using (true);

create policy "alabanzas_insert_authenticated"
  on public.alabanzas
  for insert
  to authenticated
  with check (true);

create policy "alabanzas_update_authenticated"
  on public.alabanzas
  for update
  to authenticated
  using (true)
  with check (true);

create policy "alabanzas_delete_authenticated"
  on public.alabanzas
  for delete
  to authenticated
  using (true);

-- =============================================================================
-- DEVOCIONALES
-- =============================================================================

alter table public.devocionales enable row level security;

drop policy if exists "devocionales_select_authenticated" on public.devocionales;
drop policy if exists "devocionales_insert_authenticated" on public.devocionales;
drop policy if exists "devocionales_update_authenticated" on public.devocionales;
drop policy if exists "devocionales_delete_authenticated" on public.devocionales;

create policy "devocionales_select_authenticated"
  on public.devocionales
  for select
  to authenticated
  using (true);

create policy "devocionales_insert_authenticated"
  on public.devocionales
  for insert
  to authenticated
  with check (true);

create policy "devocionales_update_authenticated"
  on public.devocionales
  for update
  to authenticated
  using (true)
  with check (true);

create policy "devocionales_delete_authenticated"
  on public.devocionales
  for delete
  to authenticated
  using (true);
