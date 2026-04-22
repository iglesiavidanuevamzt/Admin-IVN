'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, AlertTriangle, AlertCircle, Calendar, ArrowLeft, 
  Send, Users, ImageIcon, Upload, Loader2,
  AlignLeft, History, X, Trash2, Edit3, Clock, CheckCircle, Copy, Search 
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
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // ESTADOS PARA BÚSQUEDA EN HISTORIAL
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const ministerios = [
    'General', 'Varones Vida Nueva', 'Mujeres Awaken VN', 
    'Jóvenes Awaken VN', 'Kids Awaken', 'Alabanza', 'Liderazgo'
  ];

  const opcionesVigencia = [
    { label: '+1 DÍA', dias: 1 },
    { label: '+3 DÍAS', dias: 3 },
    { label: '+1 SEMANA', dias: 7 },
    { label: '+15 DÍAS', dias: 15 },
  ];

  const fetchHistorial = async () => {
    const { data } = await supabase
      .from('anuncios')
      .select('*')
      .order('creado_el', { ascending: false });
    if (data) setHistorial(data);
  };

  useEffect(() => { fetchHistorial(); }, []);

  // LÓGICA DE FILTRADO COMBINADO
  const filteredHistorial = historial.filter((item) => {
    const matchesDate = filterDate ? item.fecha_publicacion === filterDate : true;
    const matchesTitle = searchTerm 
      ? item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) 
      : true;
    return matchesDate && matchesTitle;
  });

  const aplicarVigenciaRapida = (dias: number) => {
    const base = (form as any).fechaPublicacion ? new Date((form as any).fechaPublicacion + 'T12:00:00') : new Date();
    const fin = new Date(base);
    fin.setDate(base.getDate() + dias);
    onChange('fechaExpiracion' as keyof FormState, fin.toISOString().split('T')[0]);
  };

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

  const startEditing = (item: any) => {
    setEditingId(item.id);
    onChange('id' as keyof FormState, item.id);
    onChange('titulo' as keyof FormState, item.titulo);
    onChange('mensaje' as keyof FormState, item.mensaje);
    onChange('ministerio' as keyof FormState, item.ministerio);
    onChange('urgencia' as keyof FormState, item.urgencia);
    onChange('fechaExpiracion' as keyof FormState, item.fecha_expiracion);
    onChange('fechaPublicacion' as keyof FormState, item.fecha_public_acion || item.fecha_publicacion);
    onChange('imagen_url' as keyof FormState, item.imagen_url);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('anuncios').delete().eq('id', itemToDelete);
    if (!error) {
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
      const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath);
      onChange('imagen_url' as keyof FormState, publicUrl);
    } catch (err: any) {
      setErrorMessage("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!form.titulo) {
      setShowValidationModal(true);
      return;
    }

    const normalizar = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase();
    const tituloActual = normalizar(form.titulo);

    const esRepetido = historial.some(item => 
      normalizar(item.titulo) === tituloActual && item.id !== editingId
    );

    if (esRepetido) {
      setShowDuplicateModal(true);
      return;
    }

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
      };

      const { error } = (editingId || form.id) 
        ? await supabase.from('anuncios').update(payload).eq('id', editingId || form.id)
        : await supabase.from('anuncios').insert([payload]);

      if (error) throw error;
      
      setShowSuccessModal(true);
      resetFormFields();
      fetchHistorial();
    } catch (err: any) {
      setErrorMessage("Error al guardar el aviso: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 w-full max-w-full overflow-x-hidden relative">
      
      {/* MODALES DE COMUNICACIÓN */}
      <AnimatePresence>
        {showDuplicateModal && (
          <div className="fixed inset-0 z-[270] flex items-center justify-center p-4 bg-[#1b3a4a]/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy className="w-8 h-8 text-[#85A3A5]" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase tracking-tighter">Título en uso</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed px-2">Ya existe una actividad con este nombre. Intenta usar un título más específico.</p>
              <button onClick={() => setShowDuplicateModal(false)} className="w-full bg-[#1b3a4a] text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95">ENTENDIDO</button>
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
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 uppercase tracking-tighter">Título Requerido</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Por favor, escribe el nombre de la Actividad antes de continuar.</p>
              <button onClick={() => setShowValidationModal(false)} className="w-full bg-[#1b3a4a] text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest transition-all active:scale-95">ENTENDIDO</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 bg-[#1b3a4a] text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          <History className="w-4 h-4" /> Historial
        </button>
      </div>

      <div className="w-full bg-[#85A3A5] rounded-[2.5rem] shadow-2xl p-5 sm:p-8 space-y-6 border border-white/20 text-left overflow-hidden flex flex-col box-border">
        {/* DISEÑO GRÁFICO */}
        <div className="space-y-3 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1">
            <ImageIcon className="w-3 h-3" /> DISEÑO GRÁFICO
          </label>
          <div className="relative border-2 border-dashed border-white/40 rounded-3xl h-40 flex flex-col items-center justify-center bg-white/5 overflow-hidden">
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={uploading} />
            {uploading ? <Loader2 className="animate-spin text-white w-8 h-8" /> : form.imagen_url ? <img src={form.imagen_url} alt="Preview" className="w-full h-full object-cover" /> : <Upload className="text-white w-8 h-8 opacity-60" />}
          </div>
        </div>

        {/* ACTIVIDAD */}
        <div className="space-y-2 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest ml-1">ACTIVIDAD / EVENTO</label>
          <input type="text" className="w-full bg-white rounded-2xl px-5 py-4 outline-none text-slate-800 text-base font-medium" placeholder="Nombre del evento..." value={form.titulo || ''} onChange={(e) => onChange('titulo', e.target.value)} />
        </div>

        {/* DESCRIPCIÓN */}
        <div className="space-y-2 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1">
            <AlignLeft className="w-3 h-3" /> Descripción
          </label>
          <textarea className="w-full bg-white rounded-2xl px-5 py-4 outline-none text-slate-800 min-h-[100px] text-base resize-none" placeholder="Detalles del aviso..." value={form.mensaje || ''} onChange={(e) => onChange('mensaje', e.target.value)} />
        </div>

        {/* MINISTERIO */}
        <div className="space-y-2 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2 ml-1">
            <Users className="w-3 h-3" /> Ministerio Encargado
          </label>
          <select className="w-full bg-white rounded-2xl px-5 py-4 outline-none text-slate-700 text-base appearance-none font-medium" value={form.ministerio || ''} onChange={(e) => onChange('ministerio', e.target.value)}>
            {ministerios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* URGENCIA */}
        <div className="space-y-3 w-full">
          <label className="text-[10px] font-black uppercase text-white tracking-widest ml-1">Nivel de Urgencia</label>
          <div className="grid grid-cols-3 gap-2 w-full">
            {[
              { id: 'informativo', label: 'Info', color: 'bg-green-600', icon: Info },
              { id: 'importante', label: 'Imp', color: 'bg-amber-500', icon: AlertTriangle },
              { id: 'urgente', label: 'Urg', color: 'bg-red-600', icon: AlertCircle }
            ].map((u) => (
              <button key={u.id} type="button" onClick={() => onChange('urgencia', u.id)} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${form.urgencia === u.id ? `${u.color} border-white text-white shadow-lg` : 'bg-[#1b3a4a]/40 border-transparent text-white/50'}`}>
                <u.icon className="w-5 h-5 mb-1" />
                <span className="text-[8px] font-bold uppercase">{u.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FECHAS */}
        <div className="space-y-6 pt-4 border-t border-white/20">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-white tracking-widest ml-1">Publicación</label>
              <input type="date" className="w-full bg-white rounded-2xl px-4 py-4 text-slate-700 text-base font-bold shadow-sm" value={(form as any).fechaPublicacion || ''} onChange={(e) => onChange('fechaPublicacion' as keyof FormState, e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-white tracking-widest ml-1">Caducidad</label>
              <input type="date" className="w-full bg-white rounded-2xl px-4 py-4 text-slate-700 text-base font-bold shadow-sm" value={(form as any).fechaExpiracion || ''} onChange={(e) => onChange('fechaExpiracion' as keyof FormState, e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN PRINCIPAL */}
      <div className="mt-12 pb-10 flex flex-col items-center">
        <button onClick={handlePublish} disabled={isSubmitting || uploading} className="w-full max-w-sm bg-[#1b3a4a] text-white text-lg font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest">
          {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : <Send className="w-6 h-6" />}
          {isSubmitting ? 'ENVIANDO...' : (editingId || form.id) ? 'GUARDAR CAMBIOS' : 'PUBLICAR AHORA'}
        </button>
      </div>

      {/* MODAL HISTORIAL CON BÚSQUEDA DUAL Y AJUSTE DE DESBORDE */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
              
              <div className="p-8 border-b bg-slate-50 text-left">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-black text-[#1b3a4a] text-lg uppercase">Historial de Avisos</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Búsqueda y gestión de eventos</p>
                  </div>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                {/* BUSCADORES COMBINADOS */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  {/* BÚSQUEDA POR TÍTULO */}
                  <div className="relative w-full sm:w-2/3">
                    <label className="text-[10px] font-black text-[#1b3a4a] uppercase tracking-widest ml-1 mb-2 block">Actividad</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85A3A5]" />
                      <input 
                        type="text" 
                        placeholder="Buscar por nombre..."
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none shadow-sm text-slate-600 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* BÚSQUEDA POR FECHA (CON CORRECCIÓN DE DESBORDE) */}
                  <div className="relative w-full sm:w-1/3">
                    <label className="text-[10px] font-black text-[#1b3a4a] uppercase tracking-widest ml-1 mb-2 block">Por Fecha</label>
                    <div className="relative flex items-center">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85A3A5] z-10" />
                      <input 
                        type="date" 
                        className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-10 py-3 text-sm outline-none shadow-sm text-slate-600 font-bold appearance-none min-w-0"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                      {filterDate && (
                        <button onClick={() => setFilterDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-full z-10">
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* LISTADO DE RESULTADOS */}
              <div className="p-6 overflow-y-auto space-y-4">
                {filteredHistorial.length > 0 ? filteredHistorial.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center hover:bg-white transition-all shadow-sm">
                    <div className="flex flex-col min-w-0 pr-4 text-left">
                      <span className="text-[10px] font-black text-[#85A3A5] uppercase mb-1">{item.fecha_publicacion}</span>
                      <p className="text-slate-600 text-sm truncate font-black uppercase tracking-tight">{item.titulo}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(item)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"><Edit3 className="w-5 h-5" /></button>
                      <button onClick={() => setItemToDelete(item.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin coincidencias</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINAR */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#1b3a4a]/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl uppercase tracking-tighter">¿Eliminar Aviso?</h3>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full bg-red-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">SÍ, ELIMINAR</button>
                <button onClick={() => setItemToDelete(null)} className="w-full bg-slate-100 text-slate-600 font-black py-4 rounded-2xl uppercase text-xs tracking-widest">CANCELAR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};