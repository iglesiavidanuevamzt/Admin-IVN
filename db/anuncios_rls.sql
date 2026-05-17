-- Políticas RLS para la tabla anuncios (ejecutar en Supabase → SQL Editor)
-- Si el admin ya usa service role en /api/admin/anuncios, el UPDATE del servidor no depende de esto.
-- El cliente (historial, lectura) SÍ depende de SELECT; INSERT/UPDATE/DELETE del cliente también.

alter table public.anuncios enable row level security;

-- Quitar políticas antiguas con el mismo nombre (ajusta si tus nombres son otros)
drop policy if exists "anuncios_select_authenticated" on public.anuncios;
drop policy if exists "anuncios_insert_authenticated" on public.anuncios;
drop policy if exists "anuncios_update_authenticated" on public.anuncios;
drop policy if exists "anuncios_delete_authenticated" on public.anuncios;

-- Lectura: usuarios autenticados (app admin con login)
create policy "anuncios_select_authenticated"
  on public.anuncios
  for select
  to authenticated
  using (true);

-- Crear avisos
create policy "anuncios_insert_authenticated"
  on public.anuncios
  for insert
  to authenticated
  with check (true);

-- Editar avisos (esta suele faltar y provoca “éxito” sin cambios en el cliente)
create policy "anuncios_update_authenticated"
  on public.anuncios
  for update
  to authenticated
  using (true)
  with check (true);

-- Eliminar avisos
create policy "anuncios_delete_authenticated"
  on public.anuncios
  for delete
  to authenticated
  using (true);
