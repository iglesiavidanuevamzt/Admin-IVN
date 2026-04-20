import React from 'react';
import { ArrowLeft, User } from 'lucide-react';

interface NavbarProps {
  currentScreen: string;
  onNavigate: (screen: any) => void;
}

export const Navbar = ({ currentScreen, onNavigate }: NavbarProps) => (
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
      <h1 className="font-serif text-base sm:text-lg text-white font-bold tracking-tight">
        Vida Nueva Awaken
      </h1>
    </div>
    
    {/* Botones de Acción según la Pantalla */}
    {currentScreen !== 'home' ? (
      <button 
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1 text-white/90 font-bold text-xs bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20 transition-all border border-white/10 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        VOLVER
      </button>
    ) : (
      <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all border border-white/10">
        <User className="w-5 h-5" />
      </button>
    )}
  </header>
);