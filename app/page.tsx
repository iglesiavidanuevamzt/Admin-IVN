'use client';

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { DevocionalForm } from './components/DevocionalForm';
import { AgendaForm } from './components/AgendaForm';
import { CaptureForm } from './components/CaptureForm'; 
import { HistoryView } from './components/HistoryView'; 
import { CalendarView } from './components/CalendarView'; 

type Screen = any;

interface FormState {
  id?: number | null;
  titulo?: string;
  ministerio?: string;
  mensaje?: string;
  urgencia?: string;
  vigencia?: string;
  fecha?: string;
  evento?: string;
  hora?: string;
  descripcion?: string;
  reflexion?: string;
  fechaExpiracion?: string;
  fechaPersonalizada?: string;
  fechaDevocional?: string;
  fechaEvento?: string;
  horaInicio?: string;
  horaFin?: string;
  descripcionEvento?: string;
  publicarEnTablon?: boolean;
  vigenciaAnuncio?: string;
  imagen_url?: string;
}

const getFechaHoy = () => new Date().toISOString().split('T')[0];

export default function AdminApp() {
  const [currentScreen, setCurrentScreen] = useState<any>('home');
  
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

  const handleNavigate = (screen: any) => {
    if (screen === 'avisos' || screen === 'anuncios') {
      setForm(prev => ({
        ...prev, 
        id: null, 
        titulo: '', 
        mensaje: '', 
        imagen_url: '', 
        fechaExpiracion: getFechaHoy() 
      }));
    }
    setCurrentScreen(screen);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentScreen={currentScreen} onNavigate={handleNavigate} />
      
      <main className="max-w-4xl mx-auto">
        {currentScreen === 'home' && (
          // @ts-ignore
          <HomeScreen onNavigate={handleNavigate} />
        )}
        
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
            onShowHistory={() => setCurrentScreen('history')} 
          />
        )}

        {currentScreen === 'history' && (
          <HistoryView 
            onBack={() => setCurrentScreen('avisos')} 
            onEdit={(aviso: any) => {
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

        {currentScreen === 'agenda-view' && (
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
