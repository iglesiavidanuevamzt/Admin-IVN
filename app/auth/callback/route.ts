import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SET_PASSWORD_PATH } from '@/lib/site-url';

function safeNextPath(nextParam: string | null): string {
  if (nextParam?.startsWith('/')) return nextParam;
  return '/';
}

function otpTypeFromParam(typeParam: string | null): 'invite' | 'recovery' | 'signup' | 'email' {
  const t = (typeParam ?? '').toLowerCase();
  if (t === 'recovery') return 'recovery';
  if (t === 'signup') return 'signup';
  if (t === 'email') return 'email';
  return 'invite';
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const { searchParams, origin } = requestUrl;
  const nextPath = safeNextPath(searchParams.get('next'));
  const redirectTarget = new URL(nextPath, origin);

  const authError = searchParams.get('error');
  const authErrorCode = searchParams.get('error_code');
  if (authError || authErrorCode) {
    const errUrl = new URL(SET_PASSWORD_PATH, origin);
    if (authErrorCode) errUrl.searchParams.set('error_code', authErrorCode);
    if (authError) errUrl.searchParams.set('error', authError);
    const desc = searchParams.get('error_description');
    if (desc) errUrl.searchParams.set('error_description', desc);
    return NextResponse.redirect(errUrl);
  }

  let response = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const token_hash = searchParams.get('token_hash');
  const typeParam = searchParams.get('type');

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpTypeFromParam(typeParam),
    });
    if (error) {
      const errUrl = new URL(SET_PASSWORD_PATH, origin);
      errUrl.searchParams.set('error', error.message);
      return NextResponse.redirect(errUrl);
    }
    return response;
  }

  const code = searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errUrl = new URL(SET_PASSWORD_PATH, origin);
      if (nextPath === SET_PASSWORD_PATH) {
        errUrl.searchParams.set('error', error.message);
        return NextResponse.redirect(errUrl);
      }
      return NextResponse.redirect(new URL('/login', origin));
    }
    return response;
  }

  return NextResponse.redirect(new URL('/', origin));
}
