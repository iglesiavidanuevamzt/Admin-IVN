'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calendar, ArrowLeft, Send, 
  Loader2, Settings, X, Trash2, Edit3, CheckCircle, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FormState } from '../../types';

interface DevocionalFormProps {
  form: FormState;
  onChange: (field: keyof FormState, value: any) => void;
  onBack: () => void;
}

export const DevocionalForm = ({ form, onChange, onBack }: DevocionalFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Nuevo estado para el Modal de Éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string | null }>({
    show: false, id: null
  });

  useEffect(() => {
    if (!editingId && !form.fechaDevocional) {
      const today = new Date().toISOString().split('T')[0];
      onChange('fechaDevocional', today);
    }
  }, [editingId, form.fechaDevocional, onChange]);

  const fetchHistorial = async () => {
    try {
      const { data, error } = await supabase
        .from('devocionales')
        .select('id, fecha, reflexion')
        .order('fecha', { ascending: false });
      if (error) throw error;
      if (data) setHistorial(data);
    } catch (error: any) {
      console.error("Error historial:", error.message);
    }
  };

  useEffect(() => { fetchHistorial(); }, []);

  const handlePublish = async () => {
    if (!form.fechaDevocional || !form.reflexion) {
      alert("Por favor, completa la fecha y la reflexión.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { fecha: form.fechaDevocional, reflexion: form.reflexion };
      
      if (editingId) {
        const { error } = await supabase.from('devocionales').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('devocionales').insert([payload]);
        if (error) throw error;
      }

      // Activamos el modal con presencia
      setShowSuccessModal(true);
      
      setEditingId(null);
      onChange('reflexion', '');
      fetchHistorial();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      const { error } = await supabase.from('devocionales').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      setConfirmDelete({ show: false, id: null });
      fetchHistorial();
    } catch (error: any) {
      alert("No se pudo eliminar: " + error.message);
    }
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    onChange('fechaDevocional', item.fecha);
    onChange('reflexion', item.reflexion);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 w-full max-w-full overflow-x-hidden relative">
      
      {/* MODAL DE ÉXITO (MENSAJE CON PRESENCIA) */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1b3a4a]/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center space-y-8 border-4 border-green-500/20"
            >
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-[#1b3a4a] font-black text-2xl uppercase tracking-tighter">¡Devocional Publicado!</h3>
                <p className="text-slate-500 font-medium text-sm px-4">
                  La reflexión ha sido guardada y sincronizada correctamente en la plataforma.
                </p>
              </div>

              <button 
                onClick={() => setShowSuccessModal(false)} 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-5 rounded-[1.5rem] shadow-lg shadow-green-200 uppercase text-xs tracking-widest transition-all active:scale-95"
              >
                Entendido, gracias
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AnimatePresence>
        {confirmDelete.show && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase">¿Eliminar Registro?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Esta acción es permanente y no se podrá recuperar el contenido del devocional.</p>
              
              <div className="flex flex-col gap-3">
                <button onClick={executeDelete} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-200 uppercase text-xs tracking-widest">
                  Sí, eliminar ahora
                </button>
                <button onClick={() => setConfirmDelete({ show: false, id: null })} className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOTONES SUPERIORES */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 bg-[#1b3a4a] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
          <Settings className="w-4 h-4" /> Historial
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="w-full bg-[#85A3A5] rounded-[2.5rem] shadow-2xl p-5 space-y-6 text-left border border-white/10 overflow-hidden flex flex-col box-border">
        
        <div className="flex flex-col w-full">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90 mb-2 ml-1">
            <Calendar className="w-3 h-3" /> FECHA DEL DEVOCIONAL
          </label>
          <input 
            type="date" 
            className="bg-white border-none rounded-2xl px-4 py-4 outline-none text-slate-600 shadow-inner text-base block box-border w-full appearance-none" 
            value={form.fechaDevocional || ''} 
            onChange={(e) => onChange('fechaDevocional', e.target.value)} 
          />
        </div>

        <div className="flex flex-col w-full">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90 mb-2 ml-1">
            <BookOpen className="w-3 h-3" /> REFLEXIÓN DIARIA
          </label>
          <textarea 
            rows={12} 
            className="bg-white border-none rounded-2xl px-4 py-4 outline-none text-slate-800 leading-relaxed resize-none shadow-inner text-base block box-border w-full appearance-none" 
            value={form.reflexion || ''} 
            onChange={(e) => onChange('reflexion', e.target.value)} 
          />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <button 
          onClick={handlePublish} disabled={isSubmitting}
          className="w-full max-w-sm bg-[#1b3a4a] text-white font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 hover:bg-[#152e3b] active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          {isSubmitting ? 'PROCESANDO...' : editingId ? 'GUARDAR MODIFICACIÓN' : 'PUBLICAR DEVOCIONAL'}
        </button>
        {editingId && (
          <button onClick={() => { setEditingId(null); onChange('reflexion', ''); }} className="text-[#1b3a4a] text-xs font-bold underline cursor-pointer uppercase tracking-tighter">
            Cancelar Edición
          </button>
        )}
      </div>

      {/* MODAL DE HISTORIAL */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col mx-4">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                <div className="text-left">
                  <h3 className="font-black text-[#1b3a4a] text-lg uppercase">Historial</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Gestiona tus publicaciones</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {historial.length > 0 ? historial.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center text-left hover:bg-white transition-all shadow-sm">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[10px] font-black text-[#85A3A5] tracking-widest uppercase mb-1">{item.fecha}</span>
                      <p className="text-slate-600 text-sm truncate font-medium">{item.reflexion}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEditing(item)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"><Edit3 className="w-5 h-5" /></button>
                      <button onClick={() => setConfirmDelete({ show: true, id: item.id })} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 text-slate-400 italic">No hay registros aún.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};