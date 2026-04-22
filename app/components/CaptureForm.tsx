'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, AlertTriangle, AlertCircle, Calendar, ArrowLeft, 
  Send, Users, ImageIcon, Upload, Loader2,
  AlignLeft, CheckCircle2, History, X, Trash2, Edit3 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FormState } from '../../types';

interface CaptureFormProps {
  form: FormState;
  onChange: (field: keyof FormState, value: any) => void;
  onBack: () => void;
  onShowHistory?: () => void;
}

export const CaptureForm = ({ form, onChange, onBack, onShowHistory }: CaptureFormProps) => {
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const ministerios = [
    'General', 'Varones Vida Nueva', 'Mujeres Awaken VN', 
    'Jóvenes Awaken VN', 'Kids Awaken', 'Alabanza', 'Liderazgo'
  ];

  const fetchHistorial = async () => {
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .order('creado_el', { ascending: false });
    
    if (error) console.error("Error cargando historial:", error.message);
    if (data) setHistorial(data);
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const resetFormFields = () => {
    const hoy = new Date().toISOString().split('T')[0]; 
    setEditingId(null);
    onChange('id' as keyof FormState, null);
    onChange('titulo' as keyof FormState, '');
    onChange('mensaje' as keyof FormState, '');
    onChange('imagen_url' as keyof FormState, '');
    onChange('ministerio' as keyof FormState, 'General');
    onChange('urgencia' as keyof FormState, 'informativo');
    onChange('fechaExpiracion' as keyof FormState, hoy);
    onChange('fechaPublicacion' as keyof FormState, hoy);
  };

  useEffect(() => {
    if (!form.id && !editingId) {
      resetFormFields();
    }
  }, [form.id, editingId]);

  const startEditing = (item: any) => {
    setEditingId(item.id);
    onChange('id' as keyof FormState, item.id);
    onChange('titulo' as keyof FormState, item.titulo);
    onChange('mensaje' as keyof FormState, item.mensaje);
    onChange('ministerio' as keyof FormState, item.ministerio);
    onChange('urgencia' as keyof FormState, item.urgencia);
    onChange('fechaExpiracion' as keyof FormState, item.fecha_expiracion);
    onChange('fechaPublicacion' as keyof FormState, item.fecha_publicacion);
    onChange('imagen_url' as keyof FormState, item.imagen_url);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('anuncios').delete().eq('id', itemToDelete);
    if (error) alert("No se pudo eliminar.");
    else {
      setItemToDelete(null);
      fetchHistorial();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `disenos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      onChange('imagen_url' as keyof FormState, publicUrl);
    } catch (err: any) {
      alert("Error al subir el diseño: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!form.titulo) {
      alert("Por favor, ingresa un título.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        titulo: form.titulo,
        ministerio: form.ministerio || 'General',
        urgencia: form.urgencia || 'informativo',
        fecha_expiracion: (form as any).fechaExpiracion || null,
        fecha_publicacion: (form as any).fechaPublicacion || null,
        imagen_url: form.imagen_url || '',
        mensaje: form.mensaje || '',
        vigencia: "24h"
      };

      let error;
      if (editingId || form.id) {
        const idToUpdate = editingId || form.id;
        const { error: updateError } = await supabase.from('anuncios').update(payload).eq('id', idToUpdate);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('anuncios').insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); 
      resetFormFields();
      fetchHistorial();
      
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 w-full max-w-full overflow-x-hidden relative">
      
      {/* NOTIFICACIÓN DE ÉXITO */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }} className="fixed top-4 left-1/2 z-[100] flex items-center gap-4 bg-[#1b3a4a] border border-green-500/30 px-6 py-4 rounded-[2rem] shadow-2xl min-w-[280px]">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div className="flex flex-col text-left text-white">
              <span className="font-bold text-sm">¡Hecho!</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/60">Aviso procesado</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE ELIMINAR */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#1b3a4a]/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[#1b3a4a] font-black text-xl uppercase tracking-tighter">¿Eliminar Registro?</h3>
                <p className="text-slate-500 text-sm font-medium">Esta acción es permanente.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest">Sí, eliminar</button>
                <button onClick={() => setItemToDelete(null)} className="w-full bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase text-xs tracking-widest">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOTONES SUPERIORES */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button 
          onClick={() => setShowHistory(true)} 
          className="flex items-center gap-2 bg-[#1b3a4a] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg"
        >
          <History className="w-4 h-4" /> Historial
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL - FIX DE DESBORDAMIENTO */}
      <div className="w-full max-w-full bg-[#85A3A5] rounded-[2.5rem] shadow-2xl p-5 sm:p-8 space-y-6 border border-white/20 text-left overflow-hidden flex flex-col box-border">
        
        {/* DISEÑO GRÁFICO */}
        <div className="space-y-3 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1">
            <ImageIcon className="w-3 h-3" /> DISEÑO GRÁFICO (JPG / PNG)
          </label>
          <div className="relative border-2 border-dashed border-white/40 rounded-3xl h-40 flex flex-col items-center justify-center bg-white/5 overflow-hidden box-border">
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={uploading} />
            {uploading ? <Loader2 className="animate-spin text-white w-8 h-8" /> : form.imagen_url ? <img src={form.imagen_url} alt="Preview" className="w-full h-full object-cover" /> : <Upload className="text-white w-8 h-8 opacity-60" />}
          </div>
        </div>

        {/* ACTIVIDAD */}
        <div className="space-y-2 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest ml-1">ACTIVIDAD / EVENTO</label>
          <input 
            type="text" 
            className="w-full bg-white border-none rounded-2xl px-5 py-4 outline-none text-slate-800 text-base box-border appearance-none m-0 block" 
            style={{ width: '100%' }}
            value={form.titulo || ''} 
            onChange={(e) => onChange('titulo', e.target.value)} 
          />
        </div>

        {/* DESCRIPCIÓN */}
        <div className="space-y-2 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1">
            <AlignLeft className="w-3 h-3" /> Descripción
          </label>
          <textarea 
            className="w-full bg-white border-none rounded-2xl px-5 py-4 outline-none text-slate-800 min-h-[100px] text-base box-border appearance-none m-0 block resize-none" 
            style={{ width: '100%' }}
            value={form.mensaje || ''} 
            onChange={(e) => onChange('mensaje', e.target.value)} 
          />
        </div>

        {/* MINISTERIO */}
        <div className="space-y-2 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1">
            <Users className="w-3 h-3" /> Ministerio Encargado
          </label>
          <div className="relative w-full">
            <select 
              className="w-full bg-white border-none rounded-2xl px-5 py-4 outline-none appearance-none text-slate-700 text-base box-border block m-0" 
              style={{ width: '100%' }}
              value={form.ministerio || ''} 
              onChange={(e) => onChange('ministerio', e.target.value)}
            >
              {ministerios.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
          </div>
        </div>

        {/* NIVEL DE URGENCIA - DISTRIBUCIÓN HORIZONTAL (MEJORADO) */}
        <div className="space-y-3 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest ml-1">Nivel de Urgencia</label>
          <div className="grid grid-cols-3 gap-2 w-full">
            {[
              { id: 'informativo', label: 'Info', color: 'bg-green-600', icon: Info },
              { id: 'importante', label: 'Imp', color: 'bg-amber-500', icon: AlertTriangle },
              { id: 'urgente', label: 'Urg', color: 'bg-red-600', icon: AlertCircle }
            ].map((u) => (
              <button 
                key={u.id} 
                type="button" 
                onClick={() => onChange('urgencia', u.id)} 
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                  form.urgencia === u.id 
                    ? `${u.color} border-white text-white shadow-lg` 
                    : 'bg-[#1b3a4a]/40 border-transparent text-white/50'
                }`}
              >
                <u.icon className="w-5 h-5 mb-1" />
                <span className="text-[8px] font-bold uppercase tracking-tighter">{u.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FECHAS */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1">Publicación</label>
            <input 
              type="date" 
              className="w-full bg-white border-none rounded-2xl px-4 py-4 outline-none text-slate-700 text-base box-border appearance-none m-0" 
              value={(form as any).fechaPublicacion || ''} 
              onChange={(e) => onChange('fechaPublicacion' as keyof FormState, e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1">Caducidad</label>
            <input 
              type="date" 
              className="w-full bg-white border-none rounded-2xl px-4 py-4 outline-none text-slate-700 text-base box-border appearance-none m-0" 
              value={(form as any).fechaExpiracion || ''} 
              onChange={(e) => onChange('fechaExpiracion' as keyof FormState, e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="mt-12 pb-10 flex flex-col items-center gap-4">
        <button 
          onClick={handlePublish} 
          disabled={isSubmitting || uploading} 
          className="w-full max-w-sm bg-[#1b3a4a] text-white font-bold py-5 rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          {isSubmitting ? 'Procesando...' : (editingId || form.id) ? 'Guardar Cambios' : 'Publicar Aviso'}
        </button>
        {editingId && (
          <button onClick={resetFormFields} className="text-[#1b3a4a] text-xs font-black uppercase tracking-widest opacity-70 mt-2">✕ Cancelar</button>
        )}
      </div>

      {/* MODAL HISTORIAL */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col mx-4 text-left">
              <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-black text-[#1b3a4a] text-lg uppercase">Historial</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Gestión de Avisos</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                {historial.length > 0 ? historial.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center text-left hover:bg-white transition-all overflow-hidden">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[10px] font-black text-[#85A3A5] tracking-widest uppercase mb-1">
                        {item.fecha_publicacion || 'HOY'}
                      </span>
                      <p className="text-slate-600 text-sm truncate font-medium uppercase">{item.titulo}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEditing(item)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl"><Edit3 className="w-5 h-5" /></button>
                      <button onClick={() => setItemToDelete(item.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                )) : <p className="text-center py-20 text-slate-400 italic">No hay avisos.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};