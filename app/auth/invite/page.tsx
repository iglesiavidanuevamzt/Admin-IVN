'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Loader2, Smartphone } from 'lucide-react';
import { isInAppBrowser, isMobileDevice } from '@/lib/auth/detect-in-app-browser';
import { createInviteRecoverySupabaseClient } from '@/lib/supabase-invite-recovery-client';

function InviteLandingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createInviteRecoverySupabaseClient(), []);

  const tokenHash = searchParams.get('token_hash')?.trim() ?? '';
  const typeParam = (searchParams.get('type') ?? 'invite').toLowerCase();
  const inApp = isInAppBrowser();
  const mobile = isMobileDevice();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueSetup = async () => {
    if (!tokenHash) {
      setError('Enlace incompleto. Pide al administrador un enlace nuevo (Generar enlace).');
      return;
    }

    setLoading(true);
    setError(null);

    const otpType = typeParam === 'recovery' ? 'recovery' : 'invite';
    const { data, error: verifyErr } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (verifyErr) {
      setError(
        verifyErr.message.includes('expired') || verifyErr.message.includes('invalid')
          ? 'Este enlace ya expiró o ya se usó. Pide un enlace nuevo (Generar enlace) y ábrelo una sola vez.'
          : verifyErr.message
      );
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError('No se pudo iniciar la sesión de invitación. Genera un enlace nuevo.');
      setLoading(false);
      return;
    }

    router.replace('/set-password');
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1b3a4a]/10 text-[#1b3a4a]">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-center font-serif text-2xl font-bold text-[#1b3a4a]">Invitación Admin IVN</h1>
        <p className="mt-2 text-center text-xs text-slate-500">
          Pulsa <strong>Continuar</strong> para activar tu invitación. No recargues esta pantalla.
        </p>

        {(inApp || mobile) && (
          <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50/90 px-4 py-3 text-left text-xs text-sky-950">
            <p className="flex items-start gap-2 font-semibold">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {inApp ? 'Abriste el enlace desde WhatsApp' : 'Estás en el móvil'}
            </p>
            <p className="mt-2 leading-relaxed">
              Si falla, menú <strong>⋮</strong> → <strong>Abrir en Safari</strong> o <strong>Abrir en Chrome</strong>,
              y vuelve a pulsar <strong>Continuar</strong>.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center text-sm text-red-800">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void continueSetup()}
          disabled={loading || !tokenHash}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b3a4a] py-3.5 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Continuar
        </button>

        {!tokenHash && (
          <p className="mt-3 text-center text-xs text-amber-800">
            Este enlace no trae código de invitación. Pide uno nuevo con «Generar enlace».
          </p>
        )}

        <p className="mt-6 text-center text-[10px] text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold text-[#1b3a4a] underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function InviteLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="h-9 w-9 animate-spin text-[#1b3a4a]/35" />
        </div>
      }
    >
      <InviteLandingInner />
    </Suspense>
  );
}
