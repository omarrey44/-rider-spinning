import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f14',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px',
      fontFamily: 'var(--font-body, sans-serif)',
    }}>
      <p style={{ fontSize: 80, margin: 0, lineHeight: 1 }}>🚴</p>
      <h1 style={{ fontSize: 48, fontWeight: 800, margin: '16px 0 8px', letterSpacing: '-1px' }}>
        404
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, marginBottom: 32, maxWidth: 340 }}>
        Esta página no existe. Quizás la bici ya fue reservada por alguien más.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          background: '#e10600',
          color: '#fff',
          padding: '14px 32px',
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 15,
          textDecoration: 'none',
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
