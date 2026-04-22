'use client';

import React from 'react';
import { motion } from 'framer-motion';
// Se eliminó la importación de Search ya que no se usará
import { Screen } from '../../types';

export const HomeScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => {
  const adminCards: { id: Screen; title: string; iconPath: string }[] = [
    {
      id: 'devocional',
      title: 'Devocionales',
      iconPath: '/icons/logo_devocionales.png'
    },
    {
      id: 'avisos',
      title: 'Avisos',
      iconPath: '/icons/logo_avisos.png'
    },
    {
      id: 'alabanzas', 
      title: 'Alabanzas',
      iconPath: '/icons/alabanza.png' 
    },
    {
      id: 'agenda-view', 
      title: 'Agenda',
      iconPath: '/icons/logo_agenda.png'
    }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f5eae1] via-[#e5dfda] to-[#122e43] flex flex-col items-center justify-center p-6">
      
      {/* Se eliminó el bloque del Buscador que estaba aquí */}

      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-serif text-3xl text-[#1b3a4a]">¡Administrador!</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#faf7f2]/80 backdrop-blur-sm rounded-[3rem] p-8 shadow-2xl border border-white/30 w-full max-w-sm flex flex-col items-center"
      >
        <h2 className="text-[11px] font-black text-[#1b3a4a]/40 uppercase tracking-[0.3em] mb-8">
          ACCIONES RÁPIDAS
        </h2>

        <div className="grid grid-cols-2 gap-6 w-full">
          {adminCards.map((card) => (
            <motion.button 
              key={card.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onNavigate(card.id)}
              className="flex flex-col items-center group w-full"
            >
              <div className="w-full aspect-square bg-[#1b3a4a] rounded-[1.8rem] flex items-center justify-center p-5 shadow-lg shadow-[#1b3a4a]/20 group-hover:bg-[#2a4d5f] transition-colors overflow-hidden">
                <img 
                  src={card.iconPath} 
                  alt={card.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1b3a4a]">
                {card.title}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 opacity-30">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span className="text-[8px] font-bold tracking-[0.2em] text-[#1b3a4a] uppercase">
          Sistema Operativo Vida Interna
        </span>
      </div>
    </div>
  );
};