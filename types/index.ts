export type Screen =
  | 'home'
  | 'devocional'
  | 'agenda'
  | 'avisos'
  | 'history'
  | 'agenda-view'
  | 'alabanzas';

export interface FormState {
  id: string | null;
  titulo: string;
  ministerio: string;
  mensaje: string;
  urgencia: string;
  vigencia: string;
  fechaExpiracion: string;
  fechaPublicacion: string;
  fechaPersonalizada: string;
  reflexion: string;
  fechaDevocional: string;
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  descripcionEvento: string;
  descripcion: string;
  publicarEnTablon: boolean;
  vigenciaAnuncio: string;
  imagen_url: string;
  letra?: string;
}
