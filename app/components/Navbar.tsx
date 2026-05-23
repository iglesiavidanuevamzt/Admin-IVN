'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, User, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';

interface NavbarProps {
  currentScreen: string;
  onNavigate: (screen: any) => void;
  showUserManagement?: boolean;
}

const iconBtn =
  'flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white transition-all hover:bg-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export const Navbar = ({ currentScreen, onNavigate, showUserManagement }: NavbarProps) => {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-[#1b3a4a] px-6 py-5 shadow-md">
      <div
        className="flex cursor-pointer items-center gap-3"
        onClick={() => onNavigate('home')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate('home');
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Ir al inicio del panel"
      >
        <img src="/icons/logo.png" alt="" className="h-10 w-auto" aria-hidden />
        <h1 className="font-serif text-sm font-bold tracking-tight text-white sm:text-lg">
          Vida Nueva Awaken
        </h1>
      </div>

      {currentScreen !== 'home' ? (
        <div className="flex items-center gap-2">
          {showUserManagement && (
            <Link href="/admin/usuarios" className={iconBtn} aria-label="Gestión de usuarios">
              <Users className="h-5 w-5" aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/15 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-white/25 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            VOLVER
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {showUserManagement && (
            <Link href="/admin/usuarios" className={iconBtn} aria-label="Gestión de usuarios">
              <Users className="h-5 w-5" aria-hidden />
            </Link>
          )}
          <Link href="/perfil" className={iconBtn} aria-label="Mi perfil">
            <User className="h-5 w-5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className={iconBtn}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}
    </header>
  );
};
