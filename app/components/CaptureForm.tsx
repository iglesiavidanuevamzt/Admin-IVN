'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, AlertTriangle, AlertCircle, Calendar, ArrowLeft, 
  Send, Users, ImageIcon, Upload, Loader2,
  AlignLeft, CheckCircle2, History, X, Trash2, Edit3, Clock 
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

  // Opciones de vigencia rápida
  const opcionesVigencia = [
    { label: '+1 día', dias: 1 },
    { label: '+3 días', dias: 3 },
    { label: '+1 semana', dias: 7 },
    { label: '+15 días', dias: 15 },
  ];

  const fetchHistorial = async () => {
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .order('creado_el', { ascending: false });
    if (data) setHistorial(data);
  };

  useEffect(() => { fetchHistorial(); }, []);

  // Función para aplicar vigencia rápida
  const aplicarVigenciaRapida = (dias: number) => {
    const base = form.fechaPublicacion ? new Date(form.fechaPublicacion + 'T12:00:00') : new Date();
    const fin = new Date(base);
    fin.setDate(base.getDate() + dias);
    onChange('fechaExpiracion' as keyof FormState, fin.toISOString().split('T')[0]);
  };

  // VALIDACIÓN: Evita que la caducidad sea anterior a la publicación
  useEffect(() => {
    const pub = (form as any).fechaPublicacion;
    const exp = (form as any).fechaExpiracion;
    if (pub && exp && exp < pub) {
      onChange('fechaExpiracion' as keyof FormState, pub);
    }
  }, [(form as any).fechaPublicacion, (form as any).fechaExpiracion]);

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

  const handlePublish = async () => {
    if (!form.titulo) return alert("Ingresa un título.");
    setIsSubmitting(true);
    try {
      const payload = {
        titulo: form.titulo,
        ministerio: form.ministerio || 'General',
        urgencia: form.urgencia || 'informativo',
        fecha_expiracion: (form as any).fechaExpiracion,
        fecha_publicacion: (form as any).fechaPublicacion,
        imagen_url: form.imagen_url || '',
        mensaje: form.mensaje || '',
        vigencia: "manual"
      };

      const { error } = (editingId || form.id) 
        ? await supabase.from('anuncios').update(payload).eq('id', editingId || form.id)
        : await supabase.from('anuncios').insert([payload]);

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
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button onClick={() => setShowHistory(true)} className="bg-[#1b3a4a] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
          <History className="w-4 h-4" /> Historial
        </button>
      </div>

      <div className="w-full bg-[#85A3A5] rounded-[2.5rem] shadow-2xl p-5 sm:p-8 space-y-6 border border-white/20 overflow-hidden box-border">
        
        {/* TITULO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-white tracking-widest ml-1">Actividad / Evento</label>
          <input type="text" className="w-full bg-white rounded-2xl px-5 py-4 outline-none text-slate-800 text-base box-border appearance-none" value={form.titulo || ''} onChange={(e) => onChange('titulo', e.target.value)} />
        </div>

        {/* URGENCIA HORIZONTAL */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-white tracking-widest ml-1">Nivel de Urgencia</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'informativo', label: 'Info', color: 'bg-green-600', icon: Info },
              { id: 'importante', label: 'Imp', color: 'bg-amber-500', icon: AlertTriangle },
              { id: 'urgente', label: 'Urg', color: 'bg-red-600', icon: AlertCircle }
            ].map((u) => (
              <button key={u.id} type="button" onClick={() => onChange('urgencia', u.id)} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${form.urgencia === u.id ? `${u.color} border-white text-white shadow-md` : 'bg-[#1b3a4a]/40 border-transparent text-white/50'}`}>
                <u.icon className="w-5 h-5 mb-1" />
                <span className="text-[8px] font-black uppercase">{u.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FECHAS Y VIGENCIA */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white tracking-widest ml-1 flex items-center gap-2"><Calendar className="w-3 h-3" /> Publicación</label>
              <input type="date" className="w-full bg-white rounded-2xl px-4 py-4 text-slate-700 text-base box-border appearance-none" value={(form as any).fechaPublicacion || ''} onChange={(e) => onChange('fechaPublicacion' as keyof FormState, e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white tracking-widest ml-1 flex items-center gap-2"><Calendar className="w-3 h-3" /> Caducidad</label>
              <input type="date" className="w-full bg-white rounded-2xl px-4 py-4 text-slate-700 text-base box-border appearance-none" value={(form as any).fechaExpiracion || ''} onChange={(e) => onChange('fechaExpiracion' as keyof FormState, e.target.value)} />
            </div>
          </div>

          {/* ATAJOS DE VIGENCIA */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1"><Clock className="w-3 h-3" /> Sugerencias de duración</label>
            <div className="flex flex-wrap gap-2">
              {opcionesVigencia.map((opt) => (
                <button key={opt.dias} type="button" onClick={() => aplicarVigenciaRapida(opt.dias)} className="bg-white/20 hover:bg-white/40 text-white text-[9px] font-black uppercase px-4 py-2 rounded-full transition-all border border-white/10">
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DESCRIPCIÓN */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1"><AlignLeft className="w-3 h-3" /> Descripción</label>
          <textarea rows={4} className="w-full bg-white rounded-2xl px-5 py-4 outline-none text-slate-800 text-base box-border appearance-none resize-none" value={form.mensaje || ''} onChange={(e) => onChange('mensaje', e.target.value)} />
        </div>
      </div>

      {/* PUBLICAR */}
      <div className="mt-8 pb-10 flex flex-col items-center">
        <button onClick={handlePublish} disabled={isSubmitting} className="w-full max-w-sm bg-[#1b3a4a] text-white font-bold py-5 rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          {isSubmitting ? 'Procesando...' : (editingId || form.id) ? 'Guardar Cambios' : 'Publicar Aviso'}
        </button>
      </div>

      {/* ... (Modales de éxito y eliminación se mantienen del anterior) */}
    </motion.div>
  );
};