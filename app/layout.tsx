import type { Metadata } from 'next';
import { Inter, Crimson_Pro } from 'next/font/google';
import './globals.css'; 

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'Vida Nueva Awaken - Admin',
  description: 'Panel de Administración Profesional',
  manifest: '/manifest.json', // Mantiene la conexión al manifest
  icons: {
    // Icono para la pestaña del navegador (puedes usar el mismo u otro)
    icon: '/icons/favicon-optimized.png', 
    // CRUCIAL: Este es el icono que usará el iPhone en el escritorio
    apple: '/icons/favicon-optimized.png', 
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={`${inter.variable} ${crimsonPro.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-[#FFFFFF] text-[#10172A]">
        {children}
      </body>
    </html>
  );
}
