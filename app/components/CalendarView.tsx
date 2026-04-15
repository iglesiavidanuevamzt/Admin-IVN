'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Plus, ChevronRight, Loader2, ChevronLeft 
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const CalendarView = ({ onBack, onAddEvent }: { onBack: () => void, onAddEvent?: () => void }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1)); 
  const [selectedDate, setSelectedDate] = useState(today); 
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // EFECTO PARA COLOR DE FONDO TOTAL
  useEffect(() => {
    // Aplicamos el color directamente al html y body para evitar espacios blancos al hacer scroll
    document.documentElement.style.backgroundColor = '#F8FAFC';
    document.body.style.backgroundColor = '#F8FAFC';
    
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    const isCurrentMonth = viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear();
    if (isCurrentMonth) {
      setSelectedDate(now);
    } else {
      setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
    }
    fetchData();
  }, [viewDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: agenda } = await supabase.from('agenda').select('*');
      const { data: anuncios } = await supabase.from('anuncios').select('*');
      const unified = [
        ...(agenda || []).map(e => ({ ...e, type: 'Agenda', date: e.fecha_evento, title: e.titulo, color: 'bg-blue-600' })),
        ...(anuncios || []).map(a => ({ ...a, type: 'Aviso', date: a.fecha_expiracion, title: a.mensaje, color: 'bg-orange-500' }))
      ];
      setAllEvents(unified);
    } finally { setLoading(false); }
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const eventosDelDia = allEvents.filter(ev => {
    const d = new Date(ev.date + 'T00:00:00');
    return d.toDateString() === selectedDate.toDateString();
  });

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const blanks = Array.from({ length: firstDayOfMonth });
  const monthDays = Array.from({ length: daysInMonth });
  const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    // min-h-screen y el color de fondo aquí aseguran la cobertura total
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* BARRA SUPERIOR FIJA */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#1b3a4a] flex items-center justify-between px-6 z-[60] shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-[#1b3a4a]">VN</div>
          <span className="text-white font-medium tracking-tight">Vida Nueva Awaken</span>
        </div>
        
        <button 
          onClick={onBack}
          className="bg-[#2c4e61] hover:bg-[#3a637a] text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-md border border-white/10 transition-colors flex items-center gap-2"
        >
          <ChevronLeft size={14} /> VOLVER
        </button>
      </nav>

      <div className="w-full max-w-xl mx-auto p-4 md:p-10 flex flex-col gap-8 pt-24">
        
        {/* CABECERA DEL MES */}
        <header className="flex justify-center items-center px-2">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-6">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/20 rounded-full text-[#1b3a4a] transition-all"><ChevronLeft size={32}/></button>
              <h2 className="text-4xl font-serif font-bold text-[#1b3a4a] capitalize">
                {viewDate.toLocaleString('es-MX', { month: 'long' })}
              </h2>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/20 rounded-full text-[#1b3a4a] transition-all"><ChevronRight size={32}/></button>
            </div>
            <p className="text-[11px] text-[#1b3a4a]/50 font-black tracking-[0.4em] uppercase">{viewDate.getFullYear()}</p>
          </div>
          
          {/* He eliminado el botón "+" de aquí ya que no tenía función asignada */}
        </header>

        {/* CALENDARIO */}
        
        <section className="bg-[#85A3A5] rounded-[3.5rem] p-8 md:p-12 shadow-[0_40px_80px_rgba(0,0,0,0.25)] border-[10px] border-white relative z-10">
          <div className="grid grid-cols-7 gap-1 md:gap-4 text-center">
            {diasSemana.map((dia, i) => (
              <span key={i} className="text-[11px] font-black text-slate-300 mb-6 uppercase tracking-widest">{dia}</span>
            ))}
            {blanks.map((_, i) => <div key={`blank-${i}`} className="aspect-square" />)}
            {monthDays.map((_, i) => {
              const diaNum = i + 1;
              const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), diaNum);
              const isSelected = currentDay.toDateString() === selectedDate.toDateString();
              const tieneEvento = allEvents.some(ev => 
                new Date(ev.date + 'T00:00:00').toDateString() === currentDay.toDateString()
              );

              return (
                <button 
                  key={diaNum}
                  onClick={() => setSelectedDate(currentDay)}
                  className={`relative aspect-square rounded-full flex items-center justify-center text-base md:text-xl font-bold transition-all
                    ${isSelected ? 'bg-[#1b3a4a] text-white shadow-xl scale-110' : 'text-[#1b3a4a] hover:bg-slate-50'}
                    ${tieneEvento && !isSelected ? 'ring-2 ring-blue-300 ring-offset-4' : ''}
                  `}
                >
                  {diaNum}
                </button>
              );
            })}
          </div>
        </section>

        {/* LISTA DE ACTIVIDADES */}
        <section className="flex flex-col gap-5">
          <h3 className="text-[16px] font-black text-[#1b3a4a]/40 uppercase tracking-[0.5em] px-10">
            Actividades: {selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
          </h3>

          <AnimatePresence mode="popLayout">
            {loading ? (
               <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white/40" size={50} /></div>
            ) : eventosDelDia.length > 0 ? (
              eventosDelDia.map(ev => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={ev.id} 
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 border border-white"
                >
                  <div className="flex flex-col items-center border-r-2 border-slate-50 pr-6 min-w-[80px]">
                    <Clock size={18} className="text-slate-200 mb-1" />
                    <span className="text-xs font-black text-[#1b3a4a]">{ev.hora_inicio || 'AVISO'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${ev.color}`}></span>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{ev.type}</span>
                    </div>
                    <h4 className="font-serif text-xl text-[#1b3a4a] leading-tight">{ev.title}</h4>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center rounded-[3.5rem] bg-white/10 border-2 border-dashed border-white/20 backdrop-blur-sm">
                <p className="text-white/60 font-serif italic text-lg">No hay eventos para esta fecha</p>
              </div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};