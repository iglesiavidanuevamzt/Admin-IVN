'use client'
import { supabase } from '@/lib/supabase'
import datosViejos from '@/devocionales.json' // Aquí lo agarra automáticamente

export default function Importador() {
  const ejecutarMIGRACION = async () => {
    console.log("Iniciando subida de devocionales...");
    
    // Insertamos directamente el JSON en la tabla devocionales
    const { data, error } = await supabase
      .from('devocionales')
      .insert(datosViejos)

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("¡Éxito! " + datosViejos.length + " devocionales subidos.");
    }
  }

  return (
    <div className="p-10">
      <button 
        onClick={ejecutarMIGRACION}
        className="bg-blue-600 text-white p-4 rounded shadow"
      >
        PRESIONAR PARA SUBIR RESPALDO A SUPABASE
      </button>
    </div>
  )
}