'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calendar, ArrowLeft, Send, 
  Loader2, Settings, X, Trash2, Edit3, 
  CheckCircle, AlertTriangle, AlertCircle, Copy, Search
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
  const [filterDate, setFilterDate] = useState(''); // <--- NUEVO ESTADO PARA BUSCADOR
  
  // Modales de Comunicación
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
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

  // FILTRADO DE HISTORIAL POR FECHA
  const filteredHistorial = filterDate 
    ? historial.filter(item => item.fecha === filterDate)
    : historial;

  const handlePublish = async () => {
    if (!form.fechaDevocional || !form.reflexion) {
      setShowValidationModal(true);
      return;
    }

    const normalizar = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase();
    const contenidoActual = normalizar(form.reflexion || '');
    
    const esRepetido = historial.some(item => 
      normalizar(item.reflexion) === contenidoActual && item.id !== editingId
    );

    if (esRepetido) {
      setShowDuplicateModal(true);
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

      setShowSuccessModal(true);
      setEditingId(null);
      onChange('reflexion', '');
      fetchHistorial();
    } catch (error: any) {
      console.error("Error:", error.message);
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
      console.error("No se pudo eliminar:", error.message);
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
      
      {/* MODAL DE CONTENIDO REPETIDO */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div className="fixed inset-0 z-[270] flex items-center justify-center p-4 bg-[#1b3a4a]/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy className="w-8 h-8 text-[#85A3A5]" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase tracking-tighter">Devocional Repetido</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Esta reflexión ya existe en tu historial.</p>
              <button onClick={() => setShowDuplicateModal(false)} className="w-full bg-[#1b3a4a] text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95">ENTENDIDO</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE VALIDACIÓN */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#1b3a4a]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase tracking-tighter">Faltan Datos</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Necesitas seleccionar una fecha y escribir la reflexión diaria.</p>
              <button onClick={() => setShowValidationModal(false)} className="w-full bg-[#1b3a4a] text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95">ENTENDIDO</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE ÉXITO */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1b3a4a]/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center space-y-8 border-4 border-green-500/20"
            >
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[#1b3a4a] font-black text-2xl uppercase tracking-tighter">¡Publicado!</h3>
                <p className="text-slate-500 font-medium text-sm px-4">La reflexión ha sido guardada correctamente.</p>
              </div>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95">ENTENDIDO</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AnimatePresence>
        {confirmDelete.show && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase tracking-tight">¿Eliminar Registro?</h3>
              <div className="flex flex-col gap-3">
                <button onClick={executeDelete} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all">SÍ, ELIMINAR</button>
                <button onClick={() => setConfirmDelete({ show: false, id: null })} className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-2xl uppercase text-xs tracking-widest">CANCELAR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 bg-[#1b3a4a] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          <Settings className="w-4 h-4" /> HISTORIAL
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="w-full bg-[#85A3A5] rounded-[2.5rem] shadow-2xl p-5 sm:p-8 space-y-6 text-left border border-white/10 flex flex-col box-border">
        <div className="flex flex-col w-full space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90 ml-1">
            <Calendar className="w-3 h-3" /> FECHA DEL DEVOCIONAL
          </label>
          <input 
            type="date" 
            className="bg-white border-none rounded-2xl px-6 py-4 outline-none text-slate-600 shadow-inner text-base font-bold block w-full appearance-none" 
            value={form.fechaDevocional || ''} 
            onChange={(e) => onChange('fechaDevocional', e.target.value)} 
          />
        </div>

        <div className="flex flex-col w-full space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90 ml-1">
            <BookOpen className="w-3 h-3" /> REFLEXIÓN DIARIA
          </label>
          <textarea 
            rows={10} 
            className="bg-white border-none rounded-2xl px-6 py-4 outline-none text-slate-800 leading-relaxed resize-none shadow-inner text-base block w-full appearance-none placeholder:text-slate-300" 
            placeholder="Escribe la reflexión de hoy..."
            value={form.reflexion || ''} 
            onChange={(e) => onChange('reflexion', e.target.value)} 
          />
        </div>
      </div>

      {/* BOTÓN DE ENVÍO */}
      <div className="mt-12 flex flex-col items-center gap-4">
        <button 
          onClick={handlePublish} disabled={isSubmitting}
          className="w-full max-w-sm bg-[#1b3a4a] text-white font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          {isSubmitting ? 'PROCESANDO...' : editingId ? 'GUARDAR MODIFICACIÓN' : 'PUBLICAR DEVOCIONAL'}
        </button>
        {editingId && (
          <button onClick={() => { setEditingId(null); onChange('reflexion', ''); }} className="text-[#1b3a4a] text-xs font-black underline uppercase tracking-tighter opacity-70 hover:opacity-100 transition-all">
            ✕ Cancelar Edición
          </button>
        )}
      </div>

      {/* MODAL DE HISTORIAL CON BUSCADOR */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col mx-4">
              <div className="p-8 border-b bg-slate-50 text-left">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-black text-[#1b3a4a] text-lg uppercase tracking-tight">Archivo de Devocionales</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Consulta y edita días anteriores</p>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                {/* BUSCADOR POR FECHA */}
                <div className="relative w-full">
                  <label className="text-[10px] font-black text-[#1b3a4a] uppercase tracking-widest ml-1 mb-2 block">Buscar por fecha</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85A3A5]" />
                    <input 
                      type="date" 
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-10 py-3 text-sm outline-none shadow-sm text-slate-600 font-bold"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                    {filterDate && (
                      <button onClick={() => setFilterDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
                        <X className="w-3 h-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-left">
                {filteredHistorial.length > 0 ? filteredHistorial.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:bg-white transition-all shadow-sm">
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
                  <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    {filterDate ? "No hay registros para esta fecha" : "No hay registros almacenados"}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};