import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, BookOpen, Calendar, ArrowLeft, Send, Loader2, Settings, X, Trash2, Edit3 } from 'lucide-react';
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

  // Cargar historial para el Modal
  const fetchHistorial = async () => {
    const { data } = await supabase
      .from('devocionales')
      .select('*')
      .order('fecha', { ascending: false });
    if (data) setHistorial(data);
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const handlePublish = async () => {
    if (!form.fechaDevocional || !form.reflexion) {
      alert("Por favor, completa la fecha y la reflexión.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        // MODO EDICIÓN: Actualizar registro existente
        const { error } = await supabase
          .from('devocionales')
          .update({ 
            fecha: form.fechaDevocional, 
            reflexion: form.reflexion 
          })
          .eq('id', editingId);
        if (error) throw error;
        alert("¡Devocional actualizado con éxito!");
      } else {
        // MODO CREACIÓN: Insertar nuevo
        const { error } = await supabase
          .from('devocionales')
          .insert([{ 
            fecha: form.fechaDevocional, 
            reflexion: form.reflexion 
          }]);
        if (error) throw error;
        alert("¡Devocional publicado con éxito!");
      }

      // Resetear estado tras éxito
      setEditingId(null);
      onChange('titulo', '');
      onChange('fechaDevocional', '');
      onChange('reflexion', '');
      fetchHistorial();
      
    } catch (error: any) {
      console.error("Error:", error.message);
      alert("Hubo un error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    onChange('fechaDevocional', item.fecha);
    onChange('reflexion', item.reflexion);
    setShowHistory(false); // Cerramos el modal para que pueda ver el formulario con los datos
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este devocional definitivamente?")) {
      const { error } = await supabase.from('devocionales').delete().eq('id', id);
      if (error) alert("No se pudo eliminar.");
      else fetchHistorial();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="px-4 py-6 sm:px-5 sm:py-8 relative box-border w-full"
    >
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </button>

        <button 
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 bg-white/50 text-[#1b3a4a] px-4 py-2 rounded-xl text-xs font-black hover:bg-white transition-all shadow-sm border border-slate-200"
        >
          <Settings className="w-4 h-4" /> ADMINISTRAR HISTORIAL
        </button>
      </div>

      {/* Formulario Principal */}
      <div className="w-full max-w-full bg-[#85A3A5] rounded-[2.5rem] shadow-2xl border border-[#748f91] p-6 sm:p-8 md:p-10 space-y-8 box-border">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90">
            <Calendar className="w-3 h-3" /> FECHA DE PUBLICACIÓN
          </label>
          <input 
            type="date"
            className="w-full max-w-full bg-white border-2 border-transparent rounded-2xl px-6 py-4 focus:border-[#1b3a4a] outline-none transition-all shadow-inner text-slate-600 box-border"
            value={form.fechaDevocional}
            onChange={(e) => onChange('fechaDevocional', e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/90">
            <BookOpen className="w-3 h-3" /> REFLEXIÓN DIARIA
          </label>
          <textarea 
            rows={8}
            placeholder="Escribe la reflexión y pasajes bíblicos aquí..."
            className="w-full max-w-full bg-white border-2 border-transparent rounded-2xl px-6 py-4 focus:border-[#1b3a4a] outline-none transition-all shadow-inner resize-none text-slate-800 box-border"
            value={form.reflexion}
            onChange={(e) => onChange('reflexion', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-12 pb-10 flex flex-col items-center gap-4">
        <button 
          onClick={handlePublish}
          disabled={isSubmitting}
          className="w-full max-w-md bg-[#1b3a4a] text-white font-serif text-lg font-bold py-5 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 active:scale-95 hover:bg-[#152e3b] transition-all disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {isSubmitting ? 'PROCESANDO...' : editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR DEVOCIONAL'}
        </button>
        
        {editingId && (
          <button 
            onClick={() => { setEditingId(null); onChange('fechaDevocional', ''); onChange('reflexion', ''); }}
            className="text-[#1b3a4a] text-xs font-bold underline"
          >
            Cancelar Edición
          </button>
        )}
      </div>

      {/* MODAL DE ADMINISTRACIÓN */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-black text-[#1b3a4a] text-lg tracking-tighter">HISTORIAL DE DEVOCIONALES</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Administra o corrige tus publicaciones</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {historial.length > 0 ? historial.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-black text-[#85A3A5] tracking-widest">{item.fecha}</span>
                      <p className="text-slate-600 text-sm truncate max-w-[350px] font-medium">{item.reflexion}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditing(item)}
                        className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                        title="Editar"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20">
                    <p className="text-slate-400 text-sm italic">No hay publicaciones registradas aún.</p>
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