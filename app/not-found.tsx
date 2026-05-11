import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="notfound-page">
      <div className="notfound-container">
        <span className="notfound-code">404</span>
        <h1>Esta página se salió del carril</h1>
        <p>
          La URL que buscas no existe o ya no está disponible. Vuelve al
          inicio y reserva tu ride.
        </p>
        <Link href="/" className="btn btn-primary btn-lg">
          ← Volver al inicio
        </Link>
        <div className="notfound-links">
          <Link href="/#horarios">Horarios</Link>
          <span aria-hidden="true">·</span>
          <Link href="/#precios">Precios</Link>
          <span aria-hidden="true">·</span>
          <Link href="/#faq">FAQ</Link>
        </div>
      </div>
    </main>
  );
}
