'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { DevocionalForm } from './components/DevocionalForm';
import { CaptureForm } from './components/CaptureForm';
import { HistoryView } from './components/HistoryView';
import { PraisesForm } from './components/PraisesForm';
import { CalendarView } from './components/CalendarView';
import { FormState, Screen } from '../types';
import { supabase } from '@/lib/supabase-browser';
import { canAccessScreen, isSuperAdmin, parseRoles } from '@/lib/roles';

const getFechaHoy = () => new Date().toISOString().split('T')[0];

export default function AdminApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [appRoles, setAppRoles] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [form, setForm] = useState<FormState>({
    id: null,
    titulo: '',
    ministerio: 'General',
    mensaje: '',
    urgencia: 'informativo', 
    vigencia: '24h', 
    fechaExpiracion: getFechaHoy(),
    fechaPublicacion: getFechaHoy(),
    fechaPersonalizada: '',
    reflexion: '',
    fechaDevocional: getFechaHoy(),
    fechaEvento: getFechaHoy(),
    horaInicio: '', horaFin: '',
    descripcionEvento: '',
    descripcion: '',
    publicarEnTablon: false,
    vigenciaAnuncio: '24h',
    imagen_url: '',
    es_fijo: false
  });

  const updateForm = (field: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) setAppRoles([]);
          return;
        }
        const { data: perfil } = await supabase.from('perfiles').select('rol').eq('user_id', user.id).maybeSingle();
        const roles = Array.isArray(perfil?.rol)
          ? perfil.rol
          : (typeof perfil?.rol === 'string' ? perfil.rol.split(',') : []);
        const normalizedRoles = parseRoles(roles);
        console.log('Roles detectados:', normalizedRoles);
        if (!cancelled) setAppRoles(normalizedRoles);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    if (!canAccessScreen(appRoles, currentScreen)) {
      setCurrentScreen('home');
    }
  }, [appRoles, profileLoading, currentScreen]);

  const showUserManagement = isSuperAdmin(appRoles);

  const handleNavigate = (screen: Screen) => {
    if (!canAccessScreen(appRoles, screen)) return;
    if (screen === 'avisos') {
      setForm(prev => ({
        ...prev, id: null, titulo: '', mensaje: '',
        imagen_url: '', fechaExpiracion: getFechaHoy(), es_fijo: false
      }));
    }
    if (screen === 'alabanzas') {
      setForm(prev => ({
        ...prev, id: null, titulo: '', letra: '', autor: ''
      }));
    }
    setCurrentScreen(screen);
  };

  const isAgendaView = currentScreen === 'agenda-view';

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      {!isAgendaView && (
        <Navbar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          showUserManagement={showUserManagement}
        />
      )}
      
      {/* BOTÓN RÁPIDO PARA VER AGENDA (Opcional, puedes ponerlo en el Navbar o Home) 
      <div className="w-full px-4 max-w-4xl mx-auto pt-4 flex justify-end">
         <button 
           onClick={() => setCurrentScreen('agenda-view' as any)}
           className="bg-white border border-slate-200 text-[#1b3a4a] text-[10px] font-black px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest"
         >
           Ver Calendario de Avisos
         </button>
      </div>*/}

      <main className="mx-auto w-full max-w-4xl px-4">
        {currentScreen === 'home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            roles={appRoles}
            profileLoading={profileLoading}
            showUserManagement={showUserManagement}
          />
        )}
        
        {currentScreen === 'devocional' && (
          <DevocionalForm form={form} onChange={updateForm} onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'alabanzas' && (
          <PraisesForm form={form} onChange={updateForm} onBack={() => setCurrentScreen('home')} />
        )}
        
        {/*{currentScreen === 'agenda' && (
          <AgendaForm form={form} onChange={updateForm} onBack={() => setCurrentScreen('home')} />
        )} */}
        
        {currentScreen === 'avisos' && (
          <CaptureForm 
            form={form} 
            onChange={updateForm} 
            onBack={() => setCurrentScreen('home')} 
            onShowHistory={() => setCurrentScreen('history')}
          />
        )}

        {/* PANTALLA DE HISTORIAL */}
        {currentScreen === 'history' && (
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
                fechaPublicacion: aviso.fecha_public_acion || aviso.fecha_publicacion || getFechaHoy(),
                imagen_url: aviso.imagen_url,
                es_fijo: aviso.es_fijo === true
              });
              setCurrentScreen('avisos');
            }}
          />
        )}

        {/* --- NUEVA PANTALLA: CALENDARIO / AGENDA --- */}
        {isAgendaView && (
          <div className="w-full px-0 pb-2 sm:px-0">
            {/* Un solo offset superior: altura barra fija del calendario + safe-area (sin Navbar duplicado) */}
            <div className="pt-[calc(3rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))]">
              <button
                type="button"
                onClick={() => setCurrentScreen('home')}
                className="mb-3 ml-0 flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-bold text-[#1e293b] transition-colors hover:bg-slate-200/70 active:bg-slate-200 sm:mb-4 sm:px-3 sm:text-sm"
              >
                ← Volver al Inicio
              </button>
              <CalendarView onBack={() => handleNavigate('home')} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}