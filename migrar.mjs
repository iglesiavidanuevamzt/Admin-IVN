import fs from 'fs';

// CONFIGURACIÓN - REVISA BIEN LA URL
const SUPABASE_URL = 'https://x21u9ce5o0lepacejtsg.supabase.co'; 
const SUPABASE_KEY = 'sb_secret_iCIeYEiy3DeIYPfsiMfGqg_X9fTVSVG'; 

async function migrar() {
    try {
        if (!fs.existsSync('./devocionales.json')) {
            console.error("❌ ERROR: No encuentro el archivo 'devocionales.json' en esta carpeta.");
            return;
        }

        const datos = JSON.parse(fs.readFileSync('./devocionales.json', 'utf-8'));
        console.log(`🚀 Preparando subida de ${datos.length} registros...`);

        // Usamos una configuración de red más robusta
        const response = await fetch(`${SUPABASE_URL}/rest/v1/devocionales`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(datos),
            // Esto ayuda en algunas redes de Windows que fallan con fetch
            keepalive: true 
        });

        if (response.ok) {
            console.log("✅ ¡GLORIA A DIOS! Los 12 registros ya están en la base de datos.");
        } else {
            const errorDetalle = await response.text();
            console.error("❌ Error de Supabase (Respuesta del servidor):", errorDetalle);
        }
    } catch (err) {
        console.error("❌ ERROR TÉCNICO:");
        console.error("Mensaje:", err.message);
        console.error("Causa probable: Revisa si tienes Internet o si la URL de Supabase es correcta.");
    }
}

migrar();