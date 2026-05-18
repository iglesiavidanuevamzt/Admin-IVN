'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, AlignLeft, ArrowLeft, Send, 
  Loader2, Settings, X, Trash2, Edit3, 
  Search, CheckCircle, AlertTriangle, Copy, User
} from 'lucide-react';
import { deleteRecordViaAdminApi } from '@/lib/admin/delete-via-api';
import { supabase } from '@/lib/supabase';
import { FormState } from '../../types';

type AlabanzaItem = {
  id: string;
  titulo: string;
  letra: string;
  autor?: string | null;
  creado_el?: string;
  created_at?: string;
};

interface PraisesFormProps {
  form: FormState;
  onChange: (field: keyof FormState, value: any) => void;
  onLoadAlabanza?: (item: { id: string; titulo?: string; letra?: string; autor?: string | null }) => void;
  onResetAlabanza?: () => void;
  onBack: () => void;
}

export const PraisesForm = ({ form, onChange, onLoadAlabanza, onResetAlabanza, onBack }: PraisesFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<AlabanzaItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el flujo de comunicación visual
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string | null }>({
    show: false, id: null
  });
  const editingRecordIdRef = useRef<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const getRecordId = () => editingRecordIdRef.current ?? editingId ?? form.id ?? null;

  const sortRecientesPrimero = <T extends { creado_el?: string; created_at?: string }>(items: T[]) =>
    [...items].sort((a, b) => {
      const ta = String(a.creado_el ?? a.created_at ?? '');
      const tb = String(b.creado_el ?? b.created_at ?? '');
      if (ta && tb) return tb.localeCompare(ta);
      return 0;
    });

  useEffect(() => {
    if (form.id) {
      setEditingId(form.id);
      editingRecordIdRef.current = form.id;
    }
  }, [form.id]);

  const fetchHistorial = async () => {
    let { data, error } = await supabase
      .from('alabanzas')
      .select('*')
      .order('creado_el', { ascending: false });

    if (error) {
      const retry = await supabase
        .from('alabanzas')
        .select('*')
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      const fallback = await supabase.from('alabanzas').select('*');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      setErrorMessage('No se pudo cargar la biblioteca: ' + error.message);
      return;
    }
    if (data) setHistorial(sortRecientesPrimero(data as AlabanzaItem[]));
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const filteredAlabanzas = useMemo(() => {
    const base = searchTerm.trim()
      ? historial.filter((item) =>
          item.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : historial;

    const sorted = sortRecientesPrimero(base);

    if (!lastSavedId || searchTerm.trim()) return sorted;

    const pinned = sorted.find((item) => item.id === lastSavedId);
    if (!pinned) return sorted;
    return [pinned, ...sorted.filter((item) => item.id !== lastSavedId)];
  }, [historial, searchTerm, lastSavedId]);

  const resetLocalForm = () => {
    editingRecordIdRef.current = null;
    setEditingId(null);
    if (onResetAlabanza) {
      onResetAlabanza();
    } else {
      onChange('id' as keyof FormState, null);
      onChange('titulo' as keyof FormState, '');
      onChange('autor' as keyof FormState, '');
      onChange('letra' as keyof FormState, '');
    }
  };

  const saveAlabanzaViaApi = async (method: 'PATCH' | 'POST', body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/alabanzas', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string; alabanza?: Record<string, unknown> };
    if (!res.ok) {
      throw new Error(json.error || 'No se pudo guardar la alabanza.');
    }
    if (!json.alabanza?.id) {
      throw new Error('La base de datos no devolvió la alabanza guardada.');
    }
    return json.alabanza;
  };

  const handlePublish = async () => {
    // 1. VALIDACIÓN: Campos vacíos
    if (!form.titulo || !form.letra) {
      setShowValidationModal(true);
      return;
    }

    // 2. DETECCIÓN DE REPETIDOS (Título o Letra)
    const normalizar = (texto: string) => texto.replace(/\s+/g, ' ').trim().toLowerCase();
    
    const tituloActual = normalizar(form.titulo);
    const letraActual = normalizar(form.letra);

    const recordId = getRecordId();
    const isEditing = Boolean(recordId);

    const esRepetido = historial.some(item => {
      if (item.id === recordId) return false;
      
      const tituloIgual = normalizar(item.titulo) === tituloActual;
      const letraIgual = normalizar(item.letra) === letraActual;
      
      return tituloIgual || letraIgual;
    });

    if (esRepetido) {
      setShowDuplicateModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const autorTrim = (form.autor ?? '').trim();
      const payload = {
        titulo: form.titulo,
        letra: form.letra,
        autor: autorTrim || null,
      };

      let saved: Record<string, unknown>;
      if (isEditing) {
        saved = await saveAlabanzaViaApi('PATCH', { id: recordId, ...payload });
      } else {
        saved = await saveAlabanzaViaApi('POST', payload);
      }

      const savedId = String(saved.id);
      setLastSavedId(savedId);

      setHistorial((prev) => {
        if (isEditing) {
          return sortRecientesPrimero(
            prev.map((item) =>
              item.id === saved.id ? ({ ...item, ...saved } as AlabanzaItem) : item
            )
          );
        }
        return sortRecientesPrimero([
          saved as AlabanzaItem,
          ...prev.filter((item) => item.id !== saved.id),
        ]);
      });

      setShowSuccessModal(true);
      resetLocalForm();
      await fetchHistorial();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setErrorMessage('Error al guardar la alabanza: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await deleteRecordViaAdminApi('/api/admin/alabanzas', confirmDelete.id);
      setConfirmDelete({ show: false, id: null });
      await fetchHistorial();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar la alabanza.';
      setErrorMessage(msg);
    }
  };

  const startEditing = (item: {
    id: string;
    titulo?: string;
    letra?: string;
    autor?: string | null;
  }) => {
    editingRecordIdRef.current = item.id;
    setEditingId(item.id);
    if (onLoadAlabanza) {
      onLoadAlabanza(item);
    } else {
      onChange('id' as keyof FormState, item.id);
      onChange('titulo' as keyof FormState, item.titulo ?? '');
      onChange('autor' as keyof FormState, item.autor ?? '');
      onChange('letra' as keyof FormState, item.letra ?? '');
    }
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 relative w-full text-left overflow-x-hidden">
      
      {/* MODAL: ALABANZA REPETIDA */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div className="fixed inset-0 z-[270] flex items-center justify-center p-4 bg-[#1b3a4a]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy className="w-8 h-8 text-[#85A3A5]" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase tracking-tighter">Contenido duplicado</h3>
              <p className="mb-6 px-2 text-sm leading-relaxed text-slate-500">
                Esta alabanza (título o letra) ya existe en la biblioteca. Puedes corregir el texto o limpiar todo el formulario.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetLocalForm();
                    setShowDuplicateModal(false);
                  }}
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-4 text-xs font-black uppercase tracking-widest text-[#1e293b] transition-all hover:bg-slate-100 active:scale-[0.98]"
                >
                  Limpiar todo
                </button>
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="w-full rounded-2xl bg-[#1b3a4a] py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95"
                >
                  Corregir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE ERROR */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-red-500/20 backdrop-blur-sm">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE VALIDACIÓN (CAMPOS VACÍOS) */}
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
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Por favor, asegúrate de escribir el título y la letra de la alabanza antes de publicar.</p>
              <button onClick={() => setShowValidationModal(false)} className="w-full bg-[#1b3a4a] text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95">
                ENTENDIDO
              </button>
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
                <p className="text-slate-500 font-medium text-sm px-4">La alabanza ha sido guardada correctamente en la biblioteca.</p>
              </div>
              <button onClick={() => setShowSuccessModal(false)} className="w-full bg-green-600 text-white font-black py-5 rounded-[1.5rem] shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95">ACEPTAR</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMACIÓN BORRADO */}
      <AnimatePresence>
        {confirmDelete.show && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase tracking-tight">¿ELIMINAR ALABANZA?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Esta canción será borrada permanentemente del sistema.</p>
              <div className="flex flex-col gap-3">
                <button onClick={executeDelete} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest">SÍ, ELIMINAR</button>
                <button onClick={() => setConfirmDelete({ show: false, id: null })} className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl uppercase text-xs tracking-widest">CANCELAR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm hover:opacity-70 transition-all">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 bg-[#1b3a4a] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          <Settings className="w-4 h-4" /> BIBLIOTECA
        </button>
      </div>

      {/* FORMULARIO */}
      <div className="relative space-y-8 rounded-[2.5rem] border border-white/10 bg-[#85A3A5] p-6 pb-8 pt-14 shadow-2xl sm:p-10 sm:pb-10 sm:pt-16">
        {getRecordId() && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">
              Modo edición — al guardar se actualiza la alabanza existente
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={resetLocalForm}
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-2.5 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-white/25 active:scale-95 sm:right-6 sm:top-6 sm:gap-2 sm:px-3"
          aria-label="Limpiar formulario"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span>Limpiar</span>
        </button>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-widest ml-1">
            <Music className="w-3 h-3" /> TÍTULO DE LA ALABANZA
          </label>
          <input 
            type="text" className="w-full bg-white rounded-2xl px-6 py-4 outline-none text-slate-800 shadow-inner text-base font-medium placeholder:text-slate-300"
            placeholder="Nombre de la canción..."
            value={form.titulo || ''} onChange={(e) => onChange('titulo' as keyof FormState, e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-widest ml-1">
            <User className="w-3 h-3" /> Autor / intérprete
          </label>
          <input
            type="text"
            className="w-full rounded-2xl bg-white px-6 py-4 text-base font-medium text-slate-800 shadow-inner outline-none placeholder:text-slate-300"
            placeholder="Nombre del autor o quien interpreta la alabanza..."
            value={form.autor ?? ''}
            onChange={(e) => onChange('autor' as keyof FormState, e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-widest ml-1">
            <AlignLeft className="w-3 h-3" /> LETRA DE LA ALABANZA
          </label>
          <textarea 
            rows={10} className="w-full bg-white rounded-2xl px-6 py-4 outline-none resize-none text-slate-800 leading-relaxed shadow-inner text-base placeholder:text-slate-300"
            placeholder="Escribe o pega la letra aquí..."
            value={form.letra || ''} onChange={(e) => onChange('letra' as keyof FormState, e.target.value)}
          />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <button 
          onClick={handlePublish} disabled={isSubmitting}
          className="w-full max-w-sm bg-[#1b3a4a] text-white font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          {isSubmitting ? 'GUARDANDO...' : getRecordId() ? 'GUARDAR CAMBIOS' : 'PUBLICAR ALABANZA'}
        </button>
        {getRecordId() && (
          <button onClick={resetLocalForm} className="text-[#1b3a4a] text-xs font-black uppercase tracking-widest opacity-70 hover:opacity-100 underline">✕ Cancelar Edición</button>
        )}
      </div>

      {/* MODAL HISTORIAL / BIBLIOTECA */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-left">
                <div className="w-full mr-4">
                  <h3 className="font-black text-[#1b3a4a] text-lg uppercase tracking-tight">Biblioteca de Alabanzas</h3>
                  <div className="mt-4 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" placeholder="Buscar canción..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none shadow-sm"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-left">
                {filteredAlabanzas.length > 0 ? filteredAlabanzas.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:bg-white transition-all shadow-sm">
                    <div className="overflow-hidden pr-4">
                      <h4 className="text-sm font-black text-[#1b3a4a] truncate uppercase tracking-tight">{item.titulo}</h4>
                      {item.autor ? (
                        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-[#85A3A5]">{item.autor}</p>
                      ) : null}
                      <p className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-400">{item.letra?.substring(0, 60)}...</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEditing(item)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"><Edit3 className="w-5 h-5" /></button>
                      <button onClick={() => setConfirmDelete({ show: true, id: item.id })} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 text-slate-400 italic font-bold uppercase tracking-widest text-[10px]">No se encontraron alabanzas</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};