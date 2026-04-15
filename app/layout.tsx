import type {Metadata} from 'next';
import { Inter, Crimson_Pro } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'CoreBuilder CMS',
  description: 'Professional Headless CMS Dashboard',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-[#FFFFFF] text-[#10172A]">{children}</body>
    </html>
  );
}
