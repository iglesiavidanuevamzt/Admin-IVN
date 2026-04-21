import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, AlignLeft, ArrowLeft, Send, 
  Loader2, Settings, X, Trash2, Edit3, 
  Search, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PraisesFormProps {
  onBack: () => void;
}

export const PraisesForm = ({ onBack }: PraisesFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Notificaciones y Confirmación Estética
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'delete' }>({
    show: false, message: '', type: 'success'
  });
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; id: string | null }>({
    show: false, id: null
  });

  const [form, setForm] = useState({ titulo: '', letra: '' });

  const fetchHistorial = async () => {
    const { data, error } = await supabase
      .from('alabanzas')
      .select('*')
      .order('titulo', { ascending: true }); // Ordenado alfabéticamente para alabanzas
    if (data) setHistorial(data);
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const showNotification = (message: string, type: 'success' | 'delete') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const filteredAlabanzas = historial.filter(item => 
    item.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePublish = async () => {
    if (!form.titulo || !form.letra) return;
    setIsSubmitting(true);

    try {
      if (editingId) {
        await supabase.from('alabanzas').update({ titulo: form.titulo, letra: form.letra }).eq('id', editingId);
        showNotification("Cambios guardados con éxito", 'success');
      } else {
        await supabase.from('alabanzas').insert([{ titulo: form.titulo, letra: form.letra }]);
        showNotification("Alabanza publicada", 'success');
      }

      setEditingId(null);
      setForm({ titulo: '', letra: '' });
      fetchHistorial();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función de borrado estético
  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      const { error } = await supabase.from('alabanzas').delete().eq('id', confirmDelete.id);
      if (error) throw error;
      
      showNotification("Alabanza eliminada", 'delete');
      setConfirmDelete({ show: false, id: null });
      fetchHistorial();
    } catch (error: any) {
      alert("Error al borrar: " + error.message);
    }
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setForm({ titulo: item.titulo, letra: item.letra });
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6 relative w-full">
      
      {/* NOTIFICACIONES ESTÉTICAS (TOASTS) */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '-50%' }} 
            animate={{ opacity: 1, y: 20, x: '-50%' }} 
            exit={{ opacity: 0, y: -20, x: '-50%' }} 
            className={`fixed top-4 left-1/2 z-[110] flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl min-w-[280px] border ${
              toast.type === 'success' ? 'bg-[#1b3a4a] border-green-500/30' : 'bg-[#4a1b1b] border-red-500/30'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <Trash2 className="w-6 h-6 text-red-400" />}
            <div className="flex flex-col text-left text-white">
              <span className="font-bold text-sm">{toast.message}</span>
              <span className="text-[10px] uppercase font-black opacity-50 tracking-widest text-white/60">Sincronizado</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
      <AnimatePresence>
        {confirmDelete.show && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-[#1b3a4a] font-black text-xl mb-2 tracking-tight">¿ELIMINAR ALABANZA?</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Esta canción será eliminada de la biblioteca permanentemente.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={executeDelete}
                  className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                >
                  SÍ, ELIMINAR AHORA
                </button>
                <button 
                  onClick={() => setConfirmDelete({ show: false, id: null })}
                  className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm hover:opacity-70 transition-all">
          <ArrowLeft className="w-4 h-4" /> Volver al Panel
        </button>

        <button 
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 bg-white/50 text-[#1b3a4a] px-4 py-2 rounded-xl text-xs font-black hover:bg-white transition-all shadow-sm border border-slate-200"
        >
          <Settings className="w-4 h-4" /> ADMINISTRAR HISTORIAL
        </button>
      </div>

      <div className="w-full bg-[#85A3A5] rounded-[2.5rem] shadow-2xl border border-white/10 p-6 sm:p-10 space-y-8">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-widest">
            <Music className="w-3 h-3" /> TÍTULO DE LA ALABANZA
          </label>
          <input 
            type="text" className="w-full bg-white rounded-2xl px-6 py-4 outline-none text-slate-800 shadow-inner"
            placeholder="Nombre de la canción..."
            value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})}
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-white/90 uppercase tracking-widest">
            <AlignLeft className="w-3 h-3" /> LETRA DE LA ALABANZA
          </label>
          <textarea 
            rows={10} className="w-full bg-white rounded-2xl px-6 py-4 outline-none resize-none text-slate-800 leading-relaxed shadow-inner"
            placeholder="Escribe o pega la letra aquí..."
            value={form.letra} onChange={(e) => setForm({...form, letra: e.target.value})}
          />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <button 
          onClick={handlePublish} disabled={isSubmitting}
          className="w-full max-w-md bg-[#1b3a4a] text-white font-bold py-5 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 hover:bg-[#152e3b] active:scale-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR ALABANZA'}
        </button>
        {editingId && (
          <button 
            onClick={() => { setEditingId(null); setForm({ titulo: '', letra: '' }); }} 
            className="text-[#1b3a4a] text-xs font-bold underline cursor-pointer"
          >
            Cancelar Edición
          </button>
        )}
      </div>

      {/* MODAL DE HISTORIAL */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b3a4a]/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="text-left w-full mr-4">
                  <h3 className="font-black text-[#1b3a4a] text-lg uppercase tracking-tight">Biblioteca de Alabanzas</h3>
                  <div className="mt-4 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" placeholder="Buscar por título..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none shadow-sm focus:border-[#85A3A5] transition-all"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all shrink-0">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {filteredAlabanzas.length > 0 ? filteredAlabanzas.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center text-left hover:bg-white transition-all shadow-sm">
                    <div className="overflow-hidden pr-4">
                      <h4 className="text-sm font-black text-[#1b3a4a] truncate uppercase tracking-tight">{item.titulo}</h4>
                      <p className="text-slate-400 text-[10px] truncate font-medium uppercase tracking-widest">{item.letra.substring(0, 60)}...</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEditing(item)} className="p-3 text-blue-500 hover:bg-blue-50 rounded-2xl transition-all">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => setConfirmDelete({ show: true, id: item.id })} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 text-slate-400 italic">No se encontraron resultados.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};