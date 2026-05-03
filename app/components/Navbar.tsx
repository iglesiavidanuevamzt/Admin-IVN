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

export const Navbar = ({ currentScreen, onNavigate, showUserManagement }: NavbarProps) => {
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  return (
  <header className="bg-[#1b3a4a] py-5 px-6 shadow-md flex items-center justify-between sticky top-0 z-50">
    {/* Logo y Título */}
    <div 
      className="flex items-center gap-3 cursor-pointer" 
      onClick={() => onNavigate('home')} 
      role="button"
    >
      <img 
        src="/icons/logo.png" 
        alt="Logo Vida Nueva" 
        className="h-10 w-auto" 
      />
      <h1 className="font-serif text-sm sm:text-lg text-white font-bold tracking-tight">
        Vida Nueva Awaken
      </h1>
    </div>
    
    {/* Botones de Acción según la Pantalla */}
    {currentScreen !== 'home' ? (
      <div className="flex items-center gap-2">
        {showUserManagement && (
          <Link
            href="/admin/usuarios"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white"
            title="Gestión de usuarios"
          >
            <Users className="h-5 w-5" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white/90 transition-all hover:bg-white/20 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          VOLVER
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        {showUserManagement && (
          <Link
            href="/admin/usuarios"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white"
            title="Gestión de usuarios"
          >
            <Users className="h-5 w-5" />
          </Link>
        )}
        <Link
          href="/perfil"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white"
          title="Perfil y passkeys"
        >
          <User className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    )}
  </header>
  );
};