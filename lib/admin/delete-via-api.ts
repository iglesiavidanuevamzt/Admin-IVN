/** Elimina un registro vía API admin (service role, sin depender de RLS del cliente). */
export async function deleteRecordViaAdminApi(apiPath: string, id: string): Promise<void> {
  const res = await fetch(`${apiPath}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(json.error || 'No se pudo eliminar.');
  }
}
