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
  
  // ESTADOS PARA EL MODAL
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const ministerios = [
    'General', 'Varones Vida Nueva', 'Mujeres Awaken VN', 
    'Jóvenes Awaken VN', 'Kids Awaken', 'Alabanza', 'Liderazgo'
  ];

  // 1. CARGAR HISTORIAL (Ajustado a nombres reales de tu DB)
  const fetchHistorial = async () => {
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .order('creado_el', { ascending: false }); // Usamos creado_el según tu captura
    
    if (error) {
      console.error("Error cargando historial:", error.message);
    }
    if (data) setHistorial(data);
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  // 2. CONFIGURACIÓN INICIAL / FECHA AUTOMÁTICA
  useEffect(() => {
    if (!form.id && !editingId) {
      const hoy = new Date().toISOString().split('T')[0]; 
      onChange('titulo', '');
      onChange('mensaje', '');
      onChange('imagen_url', '');
      onChange('ministerio', 'General');
      onChange('urgencia', 'informativo');
      onChange('fechaExpiracion', hoy);
    }
  }, [form.id, editingId]);

  // 3. LÓGICA DE EDICIÓN
  const startEditing = (item: any) => {
    setEditingId(item.id);
    onChange('id', item.id);
    onChange('titulo', item.titulo);
    onChange('mensaje', item.mensaje);
    onChange('ministerio', item.ministerio);
    onChange('urgencia', item.urgencia);
    onChange('fechaExpiracion', item.fecha_expiracion); // Mapeo correcto de la DB
    onChange('imagen_url', item.imagen_url);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este aviso definitivamente?")) {
      const { error } = await supabase.from('anuncios').delete().eq('id', id);
      if (error) alert("No se pudo eliminar.");
      else fetchHistorial();
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

      onChange('imagen_url', publicUrl);
      
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
        fecha_expiracion: form.fechaExpiracion || null, // Coincide con tu columna
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
      
      setEditingId(null);
      if (!form.id) {
        onChange('titulo', '');
        onChange('mensaje', '');
        onChange('imagen_url', '');
        onChange('fechaExpiracion', new Date().toISOString().split('T')[0]);
      } else {
        setTimeout(() => onBack(), 1500);
      }
      fetchHistorial();
      
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-6 relative">
      
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 20, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }} className="fixed top-4 left-1/2 z-[100] flex items-center gap-4 bg-[#1b3a4a] border border-green-500/30 px-6 py-4 rounded-[2rem] shadow-2xl min-w-[280px]">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div className="flex flex-col text-left">
              <span className="text-white font-bold text-sm">¡Hecho!</span>
              <span className="text-white/60 text-[10px] uppercase font-black tracking-widest">Aviso procesado</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </button>

        <button 
          onClick={() => setShowHistory(true)} 
          className="flex items-center gap-2 bg-[#1b3a4a] hover:bg-[#152d3a] text-white px-5 py-2.5 rounded-full transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
        >
          <History className="w-4 h-4" /> Administrar Historial
        </button>
      </div>

      <div className="bg-[#85A3A5] rounded-[2.5rem] shadow-2xl p-8 space-y-8 border border-white/20 text-left">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> DISEÑO GRÁFICO (JPG / PNG)
          </label>
          <div className="relative border-2 border-dashed border-white/40 rounded-3xl h-44 flex flex-col items-center justify-center bg-white/5 overflow-hidden">
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={uploading} />
            {uploading ? <Loader2 className="animate-spin text-white w-8 h-8" /> : form.imagen_url ? <img src={form.imagen_url} alt="Preview" className="w-full h-full object-cover" /> : <Upload className="text-white w-8 h-8 opacity-60" />}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-white tracking-widest">ACTIVIDAD / EVENTO</label>
          <input type="text" className="w-full bg-white/90 rounded-2xl px-5 py-4 outline-none text-slate-800" value={form.titulo || ''} onChange={(e) => onChange('titulo', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2"><AlignLeft className="w-3 h-3" /> Descripción</label>
          <textarea className="w-full bg-white/90 rounded-2xl px-5 py-4 outline-none text-slate-800 min-h-[100px] resize-none" value={form.mensaje || ''} onChange={(e) => onChange('mensaje', e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2"><Users className="w-3 h-3" /> Ministerio Encargado</label>
          <select className="w-full bg-white/90 rounded-2xl px-5 py-4 outline-none appearance-none text-slate-700" value={form.ministerio || ''} onChange={(e) => onChange('ministerio', e.target.value)}>
            {ministerios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-white tracking-widest">Nivel de Urgencia</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'informativo', label: 'Info', color: 'bg-green-600', icon: Info },
              { id: 'importante', label: 'Imp', color: 'bg-amber-500', icon: AlertTriangle },
              { id: 'urgente', label: 'Urg', color: 'bg-red-600', icon: AlertCircle }
            ].map((u) => (
              <button key={u.id} type="button" onClick={() => onChange('urgencia', u.id)} className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${form.urgencia === u.id ? `${u.color} border-white text-white` : 'bg-[#1b3a4a]/40 border-transparent text-white/50'}`}>
                <u.icon className="w-6 h-6 mb-1" />
                <span className="text-[8px] font-bold uppercase">{u.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3" /> Fecha de Caducidad</label>
          <input type="date" className="w-full bg-white/90 rounded-2xl px-5 py-4 outline-none text-slate-700" value={form.fechaExpiracion || ''} onChange={(e) => onChange('fechaExpiracion', e.target.value)} />
        </div>
      </div>

      <div className="mt-12 pb-10 flex flex-col items-center gap-4">
        <button onClick={handlePublish} disabled={isSubmitting || uploading} className="w-full max-w-sm bg-[#1b3a4a] text-white font-bold py-5 rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 transition-all">
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          {isSubmitting ? 'Procesando...' : (editingId || form.id) ? 'Guardar Cambios' : 'Publicar Aviso'}
        </button>
        {(editingId) && (
          <button onClick={() => { setEditingId(null); onChange('id', null); onChange('titulo', ''); }} className="text-[#1b3a4a] text-xs font-bold underline">Cancelar Edición</button>
        )}
      </div>

      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-black text-[#1b3a4a] text-lg tracking-tighter uppercase">Historial de Avisos</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administra o corrige tus avisos</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {historial.length > 0 ? historial.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all text-left">
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-black text-[#85A3A5] tracking-widest">
                        EXPIRA: {item.fecha_expiracion || 'SIN FECHA'}
                      </span>
                      <p className="text-slate-600 text-sm truncate max-w-[300px] font-medium uppercase">{item.titulo}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(item)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )) : <p className="text-center py-20 text-slate-400 italic">No hay avisos registrados.</p>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};