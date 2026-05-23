'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calendar, ArrowLeft, Send, 
  Loader2, Settings, X, Trash2, Edit3, 
  CheckCircle, AlertTriangle, AlertCircle, Copy, Search
} from 'lucide-react';
import { deleteRecordViaAdminApi } from '@/lib/admin/delete-via-api';
import { supabase } from '@/lib/supabase';
import { FormState } from '../../types';

interface DevocionalFormProps {
  form: FormState;
  onChange: (field: keyof FormState, value: any) => void;
  onLoadDevocional?: (item: { id: string; fecha?: string; reflexion?: string }) => void;
  onResetDevocional?: () => void;
  onBack: () => void;
}

export const DevocionalForm = ({ form, onChange, onLoadDevocional, onResetDevocional, onBack }: DevocionalFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(''); 
  
  // Modales de Comunicación
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string | null }>({
    show: false, id: null
  });

  const editingRecordIdRef = useRef<string | null>(null);

  const getRecordId = () => editingRecordIdRef.current ?? editingId ?? form.id ?? null;

  useEffect(() => {
    if (form.id) {
      setEditingId(form.id);
      editingRecordIdRef.current = form.id;
    }
  }, [form.id]);

  useEffect(() => {
    if (!getRecordId() && !form.fechaDevocional) {
      const today = new Date().toISOString().split('T')[0];
      onChange('fechaDevocional', today);
    }
  }, [form.fechaDevocional, form.id, onChange]);

  const fetchHistorial = async () => {
    try {
      const { data, error } = await supabase
        .from('devocionales')
        .select('id, fecha, reflexion')
        .order('fecha', { ascending: false });
      if (error) throw error;
      if (data) setHistorial(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setErrorMessage('No se pudo cargar el historial: ' + msg);
    }
  };

  const saveDevocionalViaApi = async (method: 'PATCH' | 'POST', body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/devocionales', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string; devocional?: Record<string, unknown> };
    if (!res.ok) {
      throw new Error(json.error || 'No se pudo guardar el devocional.');
    }
    if (!json.devocional?.id) {
      throw new Error('La base de datos no devolvió el devocional guardado.');
    }
    return json.devocional;
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
    
    const recordId = getRecordId();
    const isEditing = Boolean(recordId);

    const esRepetido = historial.some(
      (item) => normalizar(item.reflexion) === contenidoActual && item.id !== recordId
    );

    if (esRepetido) {
      setShowDuplicateModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { fecha: form.fechaDevocional, reflexion: form.reflexion };

      let saved: Record<string, unknown>;
      if (isEditing) {
        saved = await saveDevocionalViaApi('PATCH', { id: recordId, ...payload });
      } else {
        saved = await saveDevocionalViaApi('POST', payload);
      }

      setHistorial((prev) => {
        if (isEditing) {
          return prev.map((item) => (item.id === saved.id ? { ...item, ...saved } : item));
        }
        return [saved, ...prev].sort((a, b) =>
          String(b.fecha ?? '').localeCompare(String(a.fecha ?? ''))
        );
      });

      setShowSuccessModal(true);
      resetFormToInitial();
      await fetchHistorial();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setErrorMessage('Error al guardar el devocional: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await deleteRecordViaAdminApi('/api/admin/devocionales', confirmDelete.id);
      setConfirmDelete({ show: false, id: null });
      await fetchHistorial();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar el devocional.';
      setErrorMessage(msg);
    }
  };

  const startEditing = (item: { id: string; fecha?: string; reflexion?: string }) => {
    editingRecordIdRef.current = item.id;
    setEditingId(item.id);
    if (onLoadDevocional) {
      onLoadDevocional(item);
    } else {
      onChange('id' as keyof FormState, item.id);
      onChange('fechaDevocional', item.fecha ?? '');
      onChange('reflexion', item.reflexion ?? '');
    }
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFormToInitial = () => {
    editingRecordIdRef.current = null;
    setEditingId(null);
    if (onResetDevocional) {
      onResetDevocional();
    } else {
      const hoy = new Date().toISOString().split('T')[0];
      onChange('id' as keyof FormState, null);
      onChange('fechaDevocional', hoy);
      onChange('reflexion', '');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 w-full max-w-full overflow-x-hidden relative">
      
      {/* MODALES DE COMUNICACIÓN (DUPLICADO, VALIDACIÓN, ÉXITO, ELIMINAR) */}
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
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">Esta reflexión ya existe en tu historial.</p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetFormToInitial();
                    setShowDuplicateModal(false);
                  }}
                  className="w-full border-2 border-slate-200 bg-slate-50 py-4 text-xs font-black uppercase tracking-widest text-[#1e293b] transition-all hover:bg-slate-100 active:scale-[0.98] rounded-2xl"
                >
                  Limpiar todo
                </button>
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="w-full bg-[#1b3a4a] py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 rounded-2xl"
                >
                  Corregir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMessage && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-red-500/20 backdrop-blur-sm">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 text-center shadow-2xl"
            >
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h3 className="mb-2 text-lg font-black uppercase tracking-tighter text-[#1b3a4a]">Algo salió mal</h3>
              <p className="mb-6 text-xs leading-relaxed text-slate-500">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="w-full rounded-2xl bg-slate-800 py-4 text-[10px] font-bold uppercase tracking-widest text-white"
              >
                CERRAR
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* HEADER PRINCIPAL */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 bg-[#1b3a4a] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          <Settings className="w-4 h-4" /> HISTORIAL
        </button>
      </div>

      {/* FORMULARIO DE ENTRADA */}
      <div className="relative box-border flex w-full flex-col space-y-6 rounded-[2.5rem] border border-white/10 bg-[#85A3A5] p-5 pb-6 pt-12 text-left shadow-2xl sm:p-8 sm:pb-8 sm:pt-14">
        {getRecordId() && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">
              Modo edición — al guardar se actualiza el devocional existente
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={resetFormToInitial}
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-2.5 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-white/25 active:scale-95 sm:right-5 sm:top-5 sm:gap-2 sm:px-3"
          aria-label="Limpiar formulario"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span>Limpiar</span>
        </button>
        <div className="flex flex-col w-full space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90 ml-1">
            <Calendar className="w-3 h-3" /> FECHA DEL DEVOCIONAL
          </label>
          <input 
            type="date" 
            className="block w-full min-w-0 max-w-full appearance-none rounded-2xl border-none bg-white px-6 py-4 text-base font-bold text-slate-600 shadow-inner outline-none" 
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

      {/* BOTONES DE ACCIÓN */}
      <div className="mt-12 flex flex-col items-center gap-4">
        <button 
          onClick={handlePublish} disabled={isSubmitting}
          className="w-full max-w-sm bg-[#1b3a4a] text-white font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          {isSubmitting ? 'PROCESANDO...' : getRecordId() ? 'GUARDAR MODIFICACIÓN' : 'PUBLICAR DEVOCIONAL'}
        </button>
        {getRecordId() && (
          <button
            type="button"
            onClick={resetFormToInitial}
            className="text-[#1b3a4a] text-xs font-black uppercase tracking-tighter underline opacity-70 transition-all hover:opacity-100"
          >
            ✕ Cancelar Edición
          </button>
        )}
      </div>

      {/* MODAL DE HISTORIAL CON BUSCADOR CORREGIDO */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col mx-4">
              
              <div className="border-b bg-slate-50 p-4 text-left sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-black text-[#1b3a4a] text-lg uppercase tracking-tight">Archivo de Devocionales</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Consulta y edita días anteriores</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="rounded-full p-2 transition-all hover:bg-slate-200"
                    aria-label="Cerrar historial"
                  >
                    <X className="w-6 h-6 text-slate-400" aria-hidden />
                  </button>
                </div>

                {/* BUSCADOR POR FECHA - AJUSTE DE DESBORDAMIENTO */}
                <div className="relative w-full">
                  <label className="text-[10px] font-black text-[#1b3a4a] uppercase tracking-widest ml-1 mb-2 block">
                    Buscar por fecha
                  </label>
                  <div className="relative flex items-center w-full">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85A3A5] z-10" />
                    <input 
                      type="date" 
                      className="block w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm font-bold text-slate-600 shadow-sm outline-none appearance-none sm:text-base"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                    {filterDate && (
                      <button
                        type="button"
                        onClick={() => setFilterDate('')}
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-slate-100 p-2 transition-all hover:bg-slate-200"
                        aria-label="Quitar filtro de fecha"
                      >
                        <X className="h-3 w-3 text-slate-400" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* LISTA DE RESULTADOS */}
              <div className="p-6 overflow-y-auto space-y-4 text-left">
                {filteredHistorial.length > 0 ? filteredHistorial.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:bg-white transition-all shadow-sm">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[10px] font-black text-[#85A3A5] tracking-widest uppercase mb-1">{item.fecha}</span>
                      <p className="text-slate-600 text-sm truncate font-medium">{item.reflexion}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                        className="rounded-2xl p-3 text-blue-600 transition-all hover:bg-blue-50"
                        aria-label={`Editar devocional del ${item.fecha}`}
                      >
                        <Edit3 className="h-5 w-5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ show: true, id: item.id })}
                        className="rounded-2xl p-3 text-red-600 transition-all hover:bg-red-50"
                        aria-label={`Eliminar devocional del ${item.fecha}`}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden />
                      </button>
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