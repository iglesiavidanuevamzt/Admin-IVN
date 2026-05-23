'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[Admin IVN] Error de cliente:', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10 notranslate" translate="no">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-center font-serif text-xl font-bold text-[#1b3a4a]">Algo no cargó bien</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
          Ocurrió un error en el panel. Suele pasar en el móvil cuando el navegador traduce la página o hay datos de
          sesión antiguos.
        </p>

        <ul className="mt-5 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-left text-xs text-slate-700">
          <li>
            <strong>1.</strong> Desactiva la traducción automática (Chrome: ⋮ → no traducir este sitio).
          </li>
          <li>
            <strong>2.</strong> Prueba en una ventana de incógnito o en Safari/Chrome, no solo en WhatsApp.
          </li>
          <li>
            <strong>3.</strong> Cierra la pestaña, vuelve a abrir{' '}
            <span className="font-medium">admin.fevidanueva.org</span> e inicia sesión de nuevo.
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1b3a4a] px-4 py-3 text-xs font-black uppercase tracking-widest text-white"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reintentar
          </button>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#1b3a4a]/30 px-4 py-3 text-center text-xs font-bold text-[#1b3a4a]"
          >
            Ir al inicio de sesión
          </Link>
        </div>

        {error.digest && (
          <p className="mt-4 text-center font-mono text-[10px] text-slate-400">Ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
