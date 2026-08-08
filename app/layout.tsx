import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rideon Spinning Studio — Pedalea Rápido. Llega Lejos.',
  description: 'Estudio de spinning en Chihuahua. Reserva tu clase y tu bicicleta en segundos.',
  icons: { icon: '/logo2.webp' },
  openGraph: {
    title: 'Rideon Spinning Studio',
    description: 'Reserva tu clase de spinning en Chihuahua. Elige tu bici, paga en línea, llega a pedalear.',
    url: 'https://rideonspinningstudio.com.mx',
    siteName: 'Rideon Spinning Studio',
    images: [{ url: 'https://rideonspinningstudio.com.mx/Hero1.png', width: 1200, height: 630, alt: 'Rideon Spinning Studio' }],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rideon Spinning Studio',
    description: 'Reserva tu clase de spinning en Chihuahua.',
    images: ['https://rideonspinningstudio.com.mx/Hero1.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
