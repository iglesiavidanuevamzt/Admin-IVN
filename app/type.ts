// Contenido para app/types.ts
export type Screen = 'anuncios' | 'agenda' | 'devocionales' | 'eventos';

export interface FormState {
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
}
