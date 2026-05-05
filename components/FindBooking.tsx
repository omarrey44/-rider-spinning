'use client';

import { useState } from 'react';

interface Booking {
  id: string;
  customer_name: string;
  bike_number: number;
  bike_row: number;
  class_title: string;
  instructor_name: string;
  day: string;
  hour: string;
  status: string;
  created_at: string;
}

export default function FindBooking() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBookings([]);
    setHasSearched(false);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo válido');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al buscar');
      }

      setBookings(data.bookings || []);
      setHasSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmada',
    pending: 'Pendiente',
    cancelled: 'Cancelada',
  };

  const statusColors: Record<string, string> = {
    confirmed: 'var(--teal-dark)',
    pending: '#f59e0b',
    cancelled: 'var(--text-muted)',
  };

  return (
    <section className="find-booking" style={{ background: 'var(--white)', padding: '80px 24px' }}>
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-eyebrow">Mis reservas</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, margin: '8px 0 0' }}>
            Buscar mi reserva
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '15px' }}>
            Ingresa el correo que usaste al reservar
          </p>
        </div>

        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            placeholder="tu@correo.com"
            required
            style={{ flex: 1, minWidth: '240px', padding: '14px 20px', borderRadius: '12px', border: '1px solid var(--gray-mid)', fontSize: '15px', outline: 'none' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: '14px 28px', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div role="alert" style={{ background: '#fef2f2', color: '#b91c1c', padding: '14px 20px', borderRadius: '12px', fontSize: '14px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {hasSearched && bookings.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '15px' }}>
            No encontramos reservas con ese correo.
          </div>
        )}

        {bookings.length > 0 && (
          <div style={{ display: 'grid', gap: '16px' }}>
            {bookings.map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'var(--gray-soft)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}>
                    {b.class_title}
                  </strong>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: statusColors[b.status] || 'var(--text-muted)',
                      background: 'var(--white)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                    }}
                  >
                    {statusLabels[b.status] || b.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontSize: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Instructor</span>
                    <strong>{b.instructor_name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Día</span>
                    <strong>{b.day}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Hora</span>
                    <strong>{b.hour}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '12px' }}>Bici</span>
                    <strong>#{String(b.bike_number).padStart(2, '0')} · Fila {b.bike_row}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
