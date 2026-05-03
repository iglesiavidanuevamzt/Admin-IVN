'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clock, Loader2, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const CalendarView = ({ onBack }: { onBack: () => void; onAddEvent?: () => void }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const isCurrentMonth =
      viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear();
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
        ...(agenda || []).map((e) => ({
          ...e,
          type: 'Agenda',
          date: e.fecha_evento,
          title: e.titulo,
          color: 'bg-blue-600',
        })),
        ...(anuncios || []).map((a) => ({
          ...a,
          type: 'Aviso',
          date: a.fecha_expiracion,
          title: a.titulo,
          color: 'bg-orange-500',
        })),
      ];
      setAllEvents(unified);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const changeYear = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear() + offset, viewDate.getMonth(), 1));
  };

  const eventosDelDia = allEvents.filter((ev) => {
    const d = new Date(ev.date + 'T00:00:00');
    return d.toDateString() === selectedDate.toDateString();
  });

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const blanks = Array.from({ length: firstDayOfMonth });
  const monthDays = Array.from({ length: daysInMonth });
  const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  const monthName = viewDate.toLocaleString('es-MX', { month: 'long' });
  const yearNum = viewDate.getFullYear();

  return (
    <div className="box-border w-full max-w-[100vw] overflow-x-hidden bg-slate-50 pb-8 sm:pb-12">
      <nav className="fixed left-0 right-0 top-0 z-[60] bg-[#1b3a4a] shadow-lg">
        <div
          className="mx-auto flex min-h-12 max-w-[100vw] items-center justify-between gap-2 sm:min-h-16"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: '0px',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#1b3a4a]">
              VN
            </div>
            <span className="min-w-0 truncate text-xs font-medium tracking-tight text-white sm:text-sm md:text-base">
              Vida Nueva Awaken
            </span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 touch-manipulation items-center gap-1.5 whitespace-nowrap rounded-md border border-white/10 bg-[#2c4e61] px-2.5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors active:bg-[#3a637a] sm:gap-2 sm:px-3"
          >
            <ChevronLeft size={14} aria-hidden /> Volver
          </button>
        </div>
      </nav>

      <div className="mx-auto box-border flex w-full min-w-0 max-w-md flex-col px-2 pb-0 pt-4 sm:px-4 sm:pt-5 md:px-6 md:pt-8">
        <div className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-200/90 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 sm:rounded-[2.5rem]">
          <div className="bg-[#1b3a4a] px-3 py-4 sm:px-6 sm:py-6">
            <div className="flex items-center justify-center gap-2 sm:gap-8 md:gap-10">
              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="touch-manipulation rounded-md p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white sm:p-1.5"
                  aria-label="Mes anterior"
                >
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="touch-manipulation rounded-md p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white sm:p-1.5"
                  aria-label="Mes siguiente"
                >
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="min-w-0 flex-1 px-1 text-center text-white">
                <p className="text-base font-medium capitalize leading-tight tracking-wide sm:text-xl md:text-2xl">
                  {monthName}
                </p>
                <p className="mt-0.5 text-base font-normal text-white/90 sm:text-lg md:text-xl">{yearNum}</p>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => changeYear(-1)}
                  className="touch-manipulation rounded-md p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white sm:p-1.5"
                  aria-label="Año anterior"
                >
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => changeYear(1)}
                  className="touch-manipulation rounded-md p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white sm:p-1.5"
                  aria-label="Año siguiente"
                >
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#85A3A5] px-2 pb-5 pt-3 sm:px-5 sm:pb-8 sm:pt-5">
            <div className="grid w-full min-w-0 grid-cols-7 gap-x-0.5 gap-y-1 text-center sm:gap-x-1 sm:gap-y-2">
              {diasSemana.map((dia, i) => (
                <span
                  key={i}
                  className="truncate pb-1 text-[9px] font-bold uppercase tracking-wider text-white/55 sm:text-[10px] md:text-[11px] sm:tracking-widest"
                >
                  {dia}
                </span>
              ))}
              {blanks.map((_, i) => (
                <div
                  key={`blank-${i}`}
                  className="flex min-h-[2.75rem] min-w-0 items-center justify-center sm:min-h-[3rem]"
                />
              ))}
              {monthDays.map((_, i) => {
                const diaNum = i + 1;
                const currentDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), diaNum);
                const isSelected = currentDay.toDateString() === selectedDate.toDateString();
                const tieneEvento = allEvents.some(
                  (ev) => new Date(ev.date + 'T00:00:00').toDateString() === currentDay.toDateString()
                );

                return (
                  <div
                    key={diaNum}
                    className="flex min-h-[2.75rem] min-w-0 items-center justify-center p-px sm:min-h-[3rem]"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDate(currentDay)}
                      className={`flex h-9 w-9 max-h-9 max-w-9 touch-manipulation items-center justify-center rounded-full text-[11px] font-bold transition-all sm:h-10 sm:w-10 sm:max-h-10 sm:max-w-10 sm:text-sm ${
                        isSelected
                          ? 'bg-[#1b3a4a] text-white shadow-md'
                          : 'text-[#1b3a4a] active:bg-white/20 sm:hover:bg-white/15'
                      } ${
                        tieneEvento && !isSelected
                          ? 'ring-[3px] ring-white ring-offset-0 sm:ring-[4px]'
                          : ''
                      } `}
                    >
                      {diaNum}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <section className="mt-8 w-full min-w-0 px-0 sm:mt-12">
          <h3 className="mx-auto mb-5 max-w-full px-1 text-center text-[10px] font-black uppercase leading-snug tracking-[0.2em] text-[#1e293b] sm:mb-8 sm:text-xs sm:tracking-[0.35em] md:tracking-[0.45em]">
            <span className="break-words">
              Actividades:{' '}
              {selectedDate.toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </h3>

          <div className="min-h-[min(42vh,380px)] w-full min-w-0">
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-sm">
                <Loader2 className="h-10 w-10 shrink-0 animate-spin text-slate-500" />
              </div>
            ) : eventosDelDia.length > 0 ? (
              <ul className="flex flex-col gap-3 pb-4 sm:gap-4">
                {eventosDelDia.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex min-w-0 items-stretch gap-3 rounded-[1.5rem] border border-slate-100/80 bg-white p-4 shadow-lg sm:gap-6 sm:rounded-[2rem] sm:p-6 md:p-8"
                  >
                    <div className="flex min-w-[4.5rem] max-w-[30%] shrink-0 flex-col items-center justify-center border-r border-slate-100 pr-3 sm:min-w-[5rem] sm:max-w-none sm:pr-6">
                      <Clock size={18} className="mb-1 shrink-0 text-slate-300" />
                      <span className="break-words text-center text-[9px] font-black uppercase leading-tight tracking-wide text-[#1b3a4a] sm:text-[10px] md:text-xs">
                        {ev.hora_inicio || ev.type}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 py-0.5">
                      <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ev.color}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {ev.type}
                        </span>
                      </div>
                      <h4 className="break-words font-serif text-base leading-snug text-[#1b3a4a] sm:text-lg md:text-xl">
                        {ev.title}
                      </h4>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-300 bg-white/70 px-4 text-center sm:px-6">
                <p className="max-w-full break-words text-sm font-medium italic leading-relaxed text-[#1e293b] sm:text-base">
                  No hay eventos para esta fecha
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
