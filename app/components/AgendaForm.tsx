import { motion } from 'motion/react';
import { 
  Type, User, Calendar, Clock, 
  ArrowLeft, Send, ChevronDown, AlignLeft 
} from 'lucide-react';
import { FormState } from '../../types';

interface AgendaFormProps {
  form: FormState;
  onChange: (field: keyof FormState, value: any) => void;
  onBack: () => void;
}

export const AgendaForm = ({ form, onChange, onBack }: AgendaFormProps) => {
  const ministerios = ['General', 'Varones', 'Mujeres', 'Jóvenes', 'Niños', 'Alabanza'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="px-4 py-6"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-[#1b3a4a] font-bold text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver al Panel
      </button>

      {/* Contenedor con fondo #85A3A5 */}
      <div className="w-full max-w-full bg-[#85A3A5] rounded-[2.5rem] shadow-xl border border-white/20 p-6 sm:p-8 space-y-6">
        
        {/* Nombre del Evento */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
            <Type className="w-3 h-3 text-white" /> NOMBRE DEL EVENTO
          </label>
          <input 
            type="text"
            className="w-full bg-white/90 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-[#1b3a4a] outline-none transition-all shadow-inner text-slate-800"
            value={form.titulo}
            onChange={(e) => onChange('titulo', e.target.value)}
          />
        </div>

        {/* NUEVO: Descripción del Mensaje */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
            <AlignLeft className="w-3 h-3 text-white" /> DESCRIPCIÓN DEL MENSAJE
          </label>
          <textarea 
            rows={4}
            className="w-full bg-white/90 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-[#1b3a4a] outline-none transition-all shadow-inner text-slate-800 resize-none"
            placeholder="Detalles adicionales del evento..."
            value={form.descripcion}
            onChange={(e) => onChange('descripcion', e.target.value)}
          />
        </div>

        {/* Ministerio Responsable */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
            <User className="w-3 h-3 text-white" /> MINISTERIO RESPONSABLE
          </label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-white/90 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-[#1b3a4a] outline-none text-slate-700 cursor-pointer transition-all"
              value={form.ministerio}
              onChange={(e) => onChange('ministerio', e.target.value)}
            >
              <option value="" disabled>Selecciona un ministerio...</option>
              {ministerios.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1b3a4a] pointer-events-none" />
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white flex items-center gap-2">
              <Calendar className="w-3 h-3" /> FECHA
            </label>
            <input 
              type="date"
              className="w-full bg-white/90 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-[#1b3a4a] outline-none text-slate-700 transition-all"
              value={form.fechaEvento}
              onChange={(e) => onChange('fechaEvento', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white flex items-center gap-2">
              <Clock className="w-3 h-3" /> HORA
            </label>
            <input 
              type="time"
              className="w-full bg-white/90 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-[#1b3a4a] outline-none text-slate-700 transition-all"
              value={form.horaInicio}
              onChange={(e) => onChange('horaInicio', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Botón Publicar */}
      <div className="mt-12 pb-10 flex justify-center">
        <button className="w-full max-w-sm bg-[#1b3a4a] text-white font-serif text-lg font-bold py-5 rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-[#152e3b]">
          <Send className="w-5 h-5" /> PUBLICAR EN LA WEB
        </button>
      </div>
    </motion.div>
  );
};