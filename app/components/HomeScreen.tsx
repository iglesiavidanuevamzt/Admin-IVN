'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Send, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 
import { Screen } from '../../types';

export const HomeScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => {
  const [showYoutubeCard, setShowYoutubeCard] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [status, setStatus] = useState<{ tipo: 'success' | 'error', msg: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const adminCards: { id: Screen; title: string; iconPath: string }[] = [
    { id: 'devocional', title: 'Devocionales', iconPath: '/icons/logo_devocionales.png' },
    { id: 'avisos', title: 'Avisos', iconPath: '/icons/logo_avisos.png' },
    { id: 'alabanzas', title: 'Alabanzas', iconPath: '/icons/alabanza.png' },
    { id: 'agenda-view', title: 'Agenda', iconPath: '/icons/logo_agenda.png' }
  ];

  // FUNCIÓN PARA EXTRAER LOS 11 CARACTERES
  const extractVideoID = (input: string) => {
    // Busca patrones comunes de YouTube y captura el ID de 11 caracteres
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = input.match(regExp);
    
    // Si es un link válido, extrae el grupo de captura correspondiente al ID
    if (match && match[7].length === 11) {
      return match[7];
    }
    
    // Si el usuario pegó directamente los 11 caracteres (ej. Acnzrys7CM8)
    const trimmed = input.trim();
    if (trimmed.length === 11) {
      return trimmed;
    }

    return null;
  };

  const handleYoutubeUpdate = async () => {
    const videoId = extractVideoID(youtubeUrl);

    if (!youtubeUrl.trim()) {
      setStatus({ tipo: 'error', msg: 'Pega un link primero' });
      return;
    }

    if (!videoId) {
      setStatus({ tipo: 'error', msg: 'No se detectó un ID válido' });
      return;
    }

    setIsUpdating(true);
    setStatus(null);

    try {
      // ACTUALIZACIÓN EN TU TABLA 'video_youtube'
      const { error } = await supabase
        .from('video_youtube')
        .update({ valor: videoId }) 
        .eq('id', '27ef9473-080b-40d5-be71-45c12c32521b'); // ID de tu captura de pantalla

      if (error) throw error;

      setStatus({ tipo: 'success', msg: `¡Guardado! ID: ${videoId}` });
      setYoutubeUrl('');
      // Cerramos la tarjeta tras el éxito
      setTimeout(() => setShowYoutubeCard(false), 2500);
    } catch (error) {
      console.error(error);
      setStatus({ tipo: 'error', msg: 'Error de red o base de datos' });
    } finally {
      setIsUpdating(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f5eae1] via-[#e5dfda] to-[#122e43] flex flex-col items-center justify-center p-6 overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-serif text-3xl text-[#1b3a4a]">¡Administrador!</h1>
      </motion.div>

      {/* ÁREA DINÁMICA DE YOUTUBE */}
      <div className="w-full max-w-sm flex flex-col items-center mb-8 h-48 justify-center">
        <AnimatePresence mode="wait">
          {!showYoutubeCard ? (
            <motion.button
              key="btn-yt"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setShowYoutubeCard(true)}
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-xl font-bold text-sm uppercase tracking-widest border-2 border-white/20"
            >
              <Youtube size={24} />
              Actualizar Vivo
            </motion.button>
          ) : (
            <motion.div
              key="card-yt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full bg-white rounded-[2.5rem] p-6 shadow-2xl relative border border-white"
            >
              <button 
                onClick={() => setShowYoutubeCard(false)}
                className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-5 px-1">
                <Youtube className="text-red-600" size={18} />
                <span className="text-[10px] font-black text-[#1b3a4a] uppercase tracking-widest">Link de Transmisión</span>
              </div>
              
              <div className="flex flex-col gap-3">
                <input 
                  type="text"
                  placeholder="Pega el link completo..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-sm outline-none border-2 border-slate-100 focus:border-red-200 transition-all text-[#1b3a4a]"
                  autoFocus
                />
                <button
                  onClick={handleYoutubeUpdate}
                  disabled={isUpdating}
                  className="w-full bg-[#1b3a4a] text-white py-4 rounded-2xl shadow-lg disabled:opacity-50 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  {isUpdating ? <Loader2 size={20} className="animate-spin" /> : 'Publicar Ahora'}
                </button>
              </div>

              <AnimatePresence>
                {status && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase py-3 rounded-xl ${
                      status.tipo === 'success' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                    }`}
                  >
                    {status.tipo === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {status.msg}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* GRID DE ACCIONES RÁPIDAS */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#faf7f2]/80 backdrop-blur-sm rounded-[3rem] p-8 shadow-2xl border border-white/30 w-full max-w-sm flex flex-col items-center"
      >
        <h2 className="text-[11px] font-black text-[#1b3a4a]/40 uppercase tracking-[0.3em] mb-8">
          SECCIONES
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