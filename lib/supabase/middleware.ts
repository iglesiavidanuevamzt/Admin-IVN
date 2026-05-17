import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_BYPASS_COOKIE,
  isEmergencyAccessBypass,
  shouldSetBypassCookie,
} from '@/lib/access/emergency';
import { isAdminOrSuperAdmin, parseRoles } from '@/lib/roles';

/**
 * Middleware de sesión Supabase + guardas mínimas de ruta.
 *
 * CAMBIOS DE SEGURIDAD (reversión):
 * - Bypass de emergencia: lib/access/emergency.ts + bloque `emergencyBypass` abajo.
 * - Guard /admin/usuarios: solo si hay sesión y NO hay bypass.
 *
 * RIESGO DE BUCLE INFINITO (evitado así):
 * - Sin sesión → /login (no vuelve a / hasta tener cookie).
 * - Con sesión en /login → / (una sola redirección).
 * - NO se validan módulos en middleware para `/` (solo en cliente page.tsx).
 * - Super-admin nunca se redirige a /login desde aquí si tiene sesión válida.
 *
 * BYPASS DE EMERGENCIA:
 *   ACCESS_EMERGENCY_BYPASS=true  o  ?access_bypass=1  en cualquier URL
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const emergencyBypass = isEmergencyAccessBypass(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === '/login' || path.startsWith('/login/');
  const isRegistro = path === '/registro' || path.startsWith('/registro/');
  const isSetPassword = path === '/set-password' || path.startsWith('/set-password/');
  const isAuthCallback = path === '/auth/callback' || path.startsWith('/auth/callback/');
  const isAdminUsuarios = path === '/admin/usuarios' || path.startsWith('/admin/usuarios/');
  const isPublicAuth = isLogin || isRegistro || isSetPassword || isAuthCallback;

  // Sin sesión → login (excepto rutas públicas). No aplica bypass: sin cookie de auth no hay app.
  if (!user && !isPublicAuth) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Sesión en login/registro → home (evita quedarse en login; no es bucle con el guard anterior).
  if (user && (isLogin || isRegistro)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  /**
   * /admin/usuarios: requiere admin o super-admin en perfiles.
   * RIESGO si falla la lectura de `perfiles` (RLS/red): un super-admin podría ser expulsado a `/`.
   * Mitigación: emergencyBypass salta este guard; super-admin con sesión sigue pudiendo usar `/`.
   */
  if (user && isAdminUsuarios && !emergencyBypass) {
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('user_id', user.id)
      .maybeSingle();

    const roles = parseRoles(Array.isArray(perfil?.rol) ? perfil.rol : perfil?.rol);

    if (perfilError || !isAdminOrSuperAdmin(roles)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  if (shouldSetBypassCookie(request)) {
    supabaseResponse.cookies.set(ACCESS_BYPASS_COOKIE, '1', {
      maxAge: 60 * 60 * 24,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return supabaseResponse;
}
