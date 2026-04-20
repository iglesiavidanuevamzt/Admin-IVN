import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Trash2, Edit3, ArrowLeft, Loader2, Calendar, User } from 'lucide-react';

interface HistoryViewProps {
  onEdit: (aviso: any) => void;
  onBack: () => void;
}

export const HistoryView = ({ onEdit, onBack }: HistoryViewProps) => {
  const [alabanzas, setAlabanzas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlabanzas();
  }, []);

  const fetchAlabanzas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alabanzas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setAlabanzas(data || []);
    setLoading(false);
  };

  const deleteAviso = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este aviso?")) return;
    
    const { error } = await supabase.from('alabanzas').delete().eq('id', id);
    if (!error) fetchAlabanzas();
    else alert("Error al eliminar");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al Formulario
      </button>

      <h2 className="text-2xl font-black text-[#1b3a4a] mb-6 uppercase tracking-tighter">Historial de Alabanzas</h2>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-[#1b3a4a]" /></div>
      ) : (
        <div className="grid gap-4">
          {alabanzas.map((aviso) => (
            <div key={aviso.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800">{aviso.titulo}</h3>
                <div className="flex gap-4 text-[10px] text-slate-500 uppercase font-bold">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {aviso.ministerio}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expira: {aviso.fecha_expiracion}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit(aviso)}
                  className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteAviso(aviso.id)}
                  className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};