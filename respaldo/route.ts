import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import datosViejos from '@/devocionales.json'; 

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  console.log("Iniciando restauración por lotes...");
  let exitos = 0;
  let errores = 0;

  // Recorremos el JSON y enviamos uno por uno para no saturar la conexión
  for (const registro of datosViejos) {
    const { error } = await supabase
      .from('devocionales')
      .insert({
        fecha: registro.fecha,
        reflexion: registro.reflexion
      });

    if (error) {
      console.error("Error en un registro:", error.message);
      errores++;
    } else {
      exitos++;
    }
  }

  return NextResponse.json({ 
    mensaje: "Proceso terminado", 
    exitos, 
    errores 
  });
}