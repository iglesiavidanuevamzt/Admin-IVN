'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Check, AlertTriangle } from 'lucide-react'; 
import { supabase } from '@/lib/supabase'; 
import { Screen } from '../../types';

export const HomeScreen = ({ onNavigate }: { onNavigate: (s: Screen) => void }) => {
  const [showYoutubeCard, setShowYoutubeCard] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Nuevo estado para controlar el modal de respuesta
  const [responseModal, setResponseModal] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const adminCards: { id: Screen; title: string; iconPath: string }[] = [
    { id: 'devocional', title: 'Devocionales', iconPath: '/icons/logo_devocionales.png' },
    { id: 'avisos', title: 'Avisos', iconPath: '/icons/logo_avisos.png' },
    { id: 'alabanzas', title: 'Alabanzas', iconPath: '/icons/alabanza.png' },
    { id: 'agenda-view', title: 'Agenda', iconPath: '/icons/logo_agenda.png' }
  ];

  const extractVideoID = (input: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = input.match(regExp);
    if (match && match[7].length === 11) return match[7];
    const trimmed = input.trim();
    if (trimmed.length === 11) return trimmed;
    return null;
  };

  const handleYoutubeUpdate = async () => {
    const videoId = extractVideoID(youtubeUrl);
    
    if (!youtubeUrl.trim() || !videoId) {
      setResponseModal({
        show: true,
        type: 'error',
        title: '¡ERROR!',
        message: 'Por favor, introduce un enlace o ID de YouTube válido.'
      });
      return;
    }
    
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('video_youtube')
        .update({ valor: videoId }) 
        .eq('id', '27ef9473-080b-40d5-be71-45c12c32521b');
      
      if (error) throw error;
      
      setYoutubeUrl('');
      setShowYoutubeCard(false);
      setResponseModal({
        show: true,
        type: 'success',
        title: '¡LISTO!',
        message: 'La transmisión en vivo ha sido actualizada correctamente.'
      });
    } catch (error) {
      setResponseModal({
        show: true,
        type: 'error',
        title: '¡FALLÓ!',
        message: 'Hubo un problema al conectar con la base de datos.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f5eae1] via-[#e5dfda] to-[#122e43] flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* TÍTULO PANEL */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="font-serif text-3xl text-[#1b3a4a]">¡Administrador!</h1>
      </motion.div>

      {/* VENTANA DE CAPTURA */}
      <div className="fixed top-72 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none">
        <AnimatePresence>
          {showYoutubeCard && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 border-slate-100 pointer-events-auto"
            >
              <button onClick={() => setShowYoutubeCard(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 rounded-full transition-all">
                <X size={24} strokeWidth={2.5} />
              </button>

              <div className="flex items-center gap-3 mb-6 px-1">
                <img src="/icons/youtube.png" alt="YouTube" className="w-[80px] h-auto object-contain" />
                <span className="text-[10px] font-black text-[#1b3a4a] uppercase tracking-widest">Configurar Vivo</span>
              </div>
              
              <div className="flex flex-col gap-3">
                <input 
                  type="text"
                  placeholder="Código o Link de YouTube..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-sm outline-none border-2 border-slate-100 focus:border-red-200 transition-all text-[#1b3a4a]"
                  autoFocus
                />
                <button
                  onClick={handleYoutubeUpdate}
                  disabled={isUpdating}
                  className="w-full bg-[#1b3a4a] text-white py-4 rounded-2xl shadow-lg font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 size={20} className="animate-spin" /> : 'Publicar Ahora'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL DE RESPUESTA (ÉXITO O ERROR) */}
      <AnimatePresence>
        {responseModal.show && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#122e43]/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 w-full max-w-sm flex flex-col items-center text-center shadow-2xl"
            >
              {/* Icono Dinámico */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${responseModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${responseModal.type === 'success' ? 'bg-[#00b341] shadow-green-200' : 'bg-[#e53e3e] shadow-red-200'}`}>
                  {responseModal.type === 'success' ? 
                    <Check size={40} strokeWidth={4} className="text-white" /> : 
                    <AlertTriangle size={40} strokeWidth={3} className="text-white" />
                  }
                </div>
              </div>

              <h2 className="text-[#1b3a4a] text-3xl font-black uppercase tracking-tighter mb-2">
                {responseModal.title}
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
                {responseModal.message}
              </p>

              <button 
                onClick={() => setResponseModal({ ...responseModal, show: false })}
                className={`w-full text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                  responseModal.type === 'success' ? 'bg-[#00b341] shadow-green-100 hover:bg-green-600' : 'bg-[#e53e3e] shadow-red-100 hover:bg-red-600'
                }`}
              >
                {responseModal.type === 'success' ? 'CONTINUAR' : 'REINTENTAR'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANEL PRINCIPAL */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#faf7f2]/80 backdrop-blur-sm rounded-[3rem] p-8 shadow-2xl border border-white/30 w-full max-w-sm flex flex-col items-center mt-4"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowYoutubeCard(true)}
          className="absolute top-2 right-6 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-slate-100 p-4 min-w-[110px] z-20"
        >
          <img src="/icons/youtube.png" alt="YouTube" className="w-20 h-auto object-contain" />
        </motion.button>

        <h2 className="text-[11px] font-black text-[#1b3a4a]/40 uppercase tracking-[0.3em] mb-8 mt-6">SECCIONES</h2>

        <div className="grid grid-cols-2 gap-6 w-full">
          {adminCards.map((card) => (
            <motion.button 
              key={card.id} whileTap={{ scale: 0.9 }} onClick={() => onNavigate(card.id)}
              className="flex flex-col items-center group w-full"
            >
              <div className="w-full aspect-square bg-[#1b3a4a] rounded-[1.8rem] flex items-center justify-center p-5 shadow-lg shadow-[#1b3a4a]/20 overflow-hidden">
                <img src={card.iconPath} alt={card.title} className="w-full h-full object-contain" />
              </div>
              <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#1b3a4a]">{card.title}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="absolute bottom-6 flex items-center gap-2 opacity-30">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span className="text-[8px] font-bold tracking-[0.2em] text-[#1b3a4a] uppercase">Sistema Operativo Vida Interna</span>
      </div>
    </div>
  );
};