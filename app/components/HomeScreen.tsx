'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../../types';

export const HomeScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => {
  const adminCards: { id: Screen; title: string; iconPath: string }[] = [
    { id: 'devocional', title: 'Devocionales', iconPath: '/icons/logo_devocionales.png' },
    { id: 'avisos', title: 'Avisos', iconPath: '/icons/logo_avisos.png' },
    { id: 'alabanzas', title: 'Alabanzas', iconPath: '/icons/alabanza.png' },
    { id: 'agenda-view', title: 'Agenda', iconPath: '/icons/logo_agenda.png' }
  ];

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

        <div className="grid w-full grid-cols-2 gap-6">
          {adminCards.map((card) => (
            <motion.button
              key={card.id}
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
      </motion.div>

      <div className="absolute bottom-6 flex items-center gap-2 opacity-30">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#1b3a4a]">Sistema Operativo Vida Interna</span>
      </div>
    </div>
  );
};
