'use client';

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { DevocionalForm } from './components/DevocionalForm';
import { AgendaForm } from './components/AgendaForm';
import { CaptureForm } from './components/CaptureForm'; 
import { HistoryView } from './components/HistoryView'; 
// NUEVA IMPORTACIÓN
import { CalendarView } from './components/CalendarView'; 
//import { FormState, Screen } from './types';

const getFechaHoy = () => new Date().toISOString().split('T')[0];

export default function AdminApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  
  const [form, setForm] = useState<FormState>({
    id: null, titulo: '', ministerio: 'General', mensaje: '', 
    urgencia: 'informativo', vigencia: '24h', fechaExpiracion: getFechaHoy(), 
    fechaPersonalizada: '', reflexion: '', fechaDevocional: getFechaHoy(),
    fechaEvento: getFechaHoy(), horaInicio: '', horaFin: '', 
    descripcionEvento: '', publicarEnTablon: false, 
    vigenciaAnuncio: '24h', imagen_url: '' 
  });

  const updateForm = (field: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNavigate = (screen: Screen) => {
    if (screen === 'avisos') {
      setForm(prev => ({
        ...prev, id: null, titulo: '', mensaje: '', 
        imagen_url: '', fechaExpiracion: getFechaHoy() 
      }));
    }
    setCurrentScreen(screen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentScreen={currentScreen} onNavigate={handleNavigate} />
      
      {/* BOTÓN RÁPIDO PARA VER AGENDA (Opcional, puedes ponerlo en el Navbar o Home) 
      <div className="max-w-4xl mx-auto px-4 pt-4 flex justify-end">
         <button 
           onClick={() => setCurrentScreen('agenda-view' as any)}
           className="bg-white border border-slate-200 text-[#1b3a4a] text-[10px] font-black px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest"
         >
           Ver Calendario de Avisos
         </button>
      </div>*/}

      <main className="max-w-4xl mx-auto">
        {currentScreen === 'home' && <HomeScreen onNavigate={handleNavigate} />}
        
        {currentScreen === 'devocional' && (
          <DevocionalForm form={form} onChange={updateForm} onBack={() => setCurrentScreen('home')} />
        )}
        
        {currentScreen === 'agenda' && (
          <AgendaForm form={form} onChange={updateForm} onBack={() => setCurrentScreen('home')} />
        )}
        
        {currentScreen === 'avisos' && (
          <CaptureForm 
            form={form} 
            onChange={updateForm} 
            onBack={() => setCurrentScreen('home')} 
            onShowHistory={() => setCurrentScreen('history' as any)} 
          />
        )}

        {/* PANTALLA DE HISTORIAL */}
        {currentScreen === ('history' as any) && (
          <HistoryView 
            onBack={() => setCurrentScreen('avisos')} 
            onEdit={(aviso) => {
              setForm({
                ...form,
                id: aviso.id,
                titulo: aviso.titulo,
                ministerio: aviso.ministerio,
                mensaje: aviso.mensaje,
                urgencia: aviso.urgencia,
                fechaExpiracion: aviso.fecha_expiracion,
                imagen_url: aviso.imagen_url
              });
              setCurrentScreen('avisos');
            }}
          />
        )}

        {/* --- NUEVA PANTALLA: CALENDARIO / AGENDA --- */}
        {currentScreen === ('agenda-view' as any) && (
          <div className="py-6">
            <button 
              onClick={() => setCurrentScreen('home')}
              className="mb-4 ml-4 flex items-center gap-2 text-[#1b3a4a] font-bold text-xs hover:underline"
            >
              ← Volver al Inicio
            </button>
            <CalendarView />
          </div>
        )}
      </main>
    </div>
  );
}
