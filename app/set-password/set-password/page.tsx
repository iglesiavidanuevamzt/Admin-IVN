'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Supabase a veces arma /set-password/set-password si Site URL ya incluye /set-password.
 * Redirección en cliente para conservar el hash (#access_token=…).
 */
export default function SetPasswordDoublePathFix() {
  useEffect(() => {
    const target = `/set-password${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-[#1b3a4a]/40" aria-hidden />
      <p className="sr-only">Redirigiendo al formulario de contraseña…</p>
    </div>
  );
}
