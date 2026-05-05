import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rideon Spinning Studio — Pedalea Rápido. Llega Lejos.',
  description: 'Estudio de spinning en Chihuahua. Reserva tu clase y tu bicicleta en segundos.',
  icons: {
    icon: '/logo2.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
