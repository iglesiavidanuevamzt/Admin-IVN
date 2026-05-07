'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Screen } from '../../types';

type HomeScreenProps = {
  onNavigate: (s: Screen) => void;
  roles: string[];
  profileLoading: boolean;
  showUserManagement: boolean;
};

export const HomeScreen = ({
  onNavigate,
  roles,
  profileLoading,
  showUserManagement,
}: HomeScreenProps) => {
  const hasRole = (...values: string[]) => values.some((v) => roles.includes(v));
  const isSuperAdmin = roles.includes('super-admin');
  const pendingVisitante =
    (roles.includes('visitante') || roles.includes('biblias')) &&
    !isSuperAdmin &&
    !hasRole('musica', 'devocional', 'devocionales', 'anuncios', 'avisos', 'agenda', 'calendario', 'encargado');
  const cards = [
    hasRole('devocional', 'devocionales') || isSuperAdmin
      ? { id: 'devocional' as Screen, title: 'Devocionales', iconPath: '/icons/logo_devocionales.png' }
      : null,
    hasRole('anuncios', 'avisos') || isSuperAdmin
      ? { id: 'avisos' as Screen, title: 'Anuncios', iconPath: '/icons/logo_avisos.png' }
      : null,
    roles.includes('musica') || isSuperAdmin
      ? { id: 'alabanzas' as Screen, title: 'Alabanzas', iconPath: '/icons/alabanza.png' }
      : null,
    hasRole('agenda', 'calendario') || isSuperAdmin
      ? { id: 'agenda-view' as Screen, title: 'Calendario', iconPath: '/icons/logo_agenda.png' }
      : null,
  ].filter(Boolean) as { id: Screen; title: string; iconPath: string }[];
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f5eae1] via-[#e5dfda] to-[#122e43] flex flex-col items-center justify-center p-6 overflow-hidden">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="font-serif text-3xl text-[#1b3a4a]">¡Administrador!</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#faf7f2]/80 backdrop-blur-sm rounded-[3rem] p-8 shadow-2xl border border-white/30 w-full max-w-sm flex flex-col items-center mt-4"
      >
        <h2 className="mb-8 mt-2 text-[11px] font-black uppercase tracking-[0.3em] text-[#1b3a4a]/40">SECCIONES</h2>

        {showUserManagement && (
          <Link
            href="/admin/usuarios"
            className="mb-6 w-full rounded-2xl border border-[#1b3a4a]/15 bg-[#1b3a4a] px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-white shadow-md transition-opacity hover:opacity-95"
          >
            Gestión de usuarios
          </Link>
        )}

        {profileLoading ? (
          <div className="flex w-full justify-center py-12 text-sm text-[#1b3a4a]/50">Cargando permisos…</div>
        ) : pendingVisitante ? (
          <div className="px-2 text-center">
            <p className="text-sm font-semibold text-[#1b3a4a]">Cuenta en revisión</p>
            <p className="mt-3 text-sm leading-relaxed text-[#1b3a4a]/75">
              Tu registro fue exitoso. Un administrador asignará pronto los módulos que necesitas. Si es urgente,
              escribe al equipo de IVN.
            </p>
          </div>
        ) : roles.length === 0 || cards.length === 0 ? (
          <p className="px-2 text-center text-sm text-[#1b3a4a]/70">
            No tienes módulos asignados. Contacta al administrador para que te asigne un rol en la tabla de perfiles.
          </p>
        ) : (
          <div className="grid w-full grid-cols-2 gap-6">
            {cards.map((card) => (
              <motion.button
                key={card.id}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => onNavigate(card.id)}
                className="group flex w-full flex-col items-center"
              >
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.8rem] bg-[#1b3a4a] p-5 shadow-lg shadow-[#1b3a4a]/20">
                  <img src={card.iconPath} alt={card.title} className="h-full w-full object-contain" />
                </div>
                <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1b3a4a]">{card.title}</span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      <div className="absolute bottom-6 flex items-center gap-2 opacity-30">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#1b3a4a]">Sistema Operativo Vida Interna</span>
      </div>
    </div>
  );
};
