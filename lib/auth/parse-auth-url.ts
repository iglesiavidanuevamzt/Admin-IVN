/** Parámetros de retorno de Supabase (hash implícito o query). */
export type AuthUrlParams = {
  access_token?: string;
  refresh_token?: string;
  type?: string;
  error?: string;
  error_description?: string;
  token_hash?: string;
  code?: string;
};

export function parseAuthParamsFromUrl(location?: Location): AuthUrlParams {
  if (typeof window === 'undefined' && !location) return {};
  const loc = location ?? window.location;
  const hash = new URLSearchParams(loc.hash.replace(/^#/, ''));
  const search = new URLSearchParams(loc.search);
  const get = (key: string) => hash.get(key) ?? search.get(key);

  return {
    access_token: get('access_token') ?? undefined,
    refresh_token: get('refresh_token') ?? undefined,
    type: get('type') ?? undefined,
    error: get('error') ?? undefined,
    error_description: get('error_description') ?? undefined,
    token_hash: get('token_hash') ?? undefined,
    code: get('code') ?? undefined,
  };
}

export function urlLooksLikeAuthRedirect(location?: Location): boolean {
  const p = parseAuthParamsFromUrl(location);
  if (p.error || p.code || p.token_hash) return true;
  if (p.access_token) return true;
  const t = (p.type ?? '').toLowerCase();
  return t === 'invite' || t === 'recovery' || t === 'signup';
}
