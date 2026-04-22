'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, AlignLeft, ArrowLeft, Send, 
  Loader2, Settings, X, Trash2, Edit3, 
  Search, CheckCircle, AlertTriangle, Copy 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FormState } from '../../types';

interface PraisesFormProps {
  form: FormState;
  onChange: (field: keyof FormState, value: any) => void;
  onBack: () => void;
}

export const PraisesForm = ({ form, onChange, onBack }: PraisesFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el flujo de comunicación visual
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false); // <--- NUEVO
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string | null }>({
    show: false, id: null
  });

  const fetchHistorial = async () => {
    const { data } = await supabase
      .from('alabanzas')
      .select('*')
      .order('titulo', { ascending: true });
    if (data) setHistorial(data);
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const filteredAlabanzas = historial.filter(item => 
    item.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetLocalForm = () => {
    setEditingId(null);
    onChange('titulo' as keyof FormState, '');
    onChange('letra' as keyof FormState, '');
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

    const esRepetido = historial.some(item => {
      // Ignorar el mismo registro si estamos editando
      if (item.id === editingId) return false;
      
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
      const payload = { titulo: form.titulo, letra: form.letra };
      
      if (editingId) {
        const { error } = await supabase.from('alabanzas').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('alabanzas').insert([payload]);
        if (error) throw error;
      }

      setShowSuccessModal(true);
      resetLocalForm();
      fetchHistorial();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      const { error } = await supabase.from('alabanzas').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      
      setConfirmDelete({ show: false, id: null });
      fetchHistorial();
    } catch (error: any) {
      console.error("Error al borrar: ", error.message);
    }
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    onChange('titulo' as keyof FormState, item.titulo);
    onChange('letra' as keyof FormState, item.letra);
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
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase tracking-tighter">Contenido Duplicado</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed px-2">Esta alabanza (título o letra) ya existe en la biblioteca. Verifica en el buscador antes de agregarla nuevamente.</p>
              <button onClick={() => setShowDuplicateModal(false)} className="w-full bg-[#1b3a4a] text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95">
                REVISAR BIBLIOTECA
              </button>
            </motion.div>
          </div>
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
      <div className="w-full bg-[#85A3A5] rounded-[2.5rem] shadow-2xl border border-white/10 p-6 sm:p-10 space-y-8">
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
          {isSubmitting ? 'GUARDANDO...' : editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR ALABANZA'}
        </button>
        {editingId && (
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
                      <p className="text-slate-400 text-[10px] truncate font-medium uppercase tracking-widest">{item.letra?.substring(0, 60)}...</p>
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