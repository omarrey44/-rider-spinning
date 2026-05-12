'use client';

import { useState } from 'react';
import { MailIcon, BikeIcon, UserIcon, CalendarIcon, AlarmClockIcon, CheckIcon } from './Icons';

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

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

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

  return (
    <section className="find-booking" id="mis-reservas">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Mis reservas</span>
          <h2>Buscar mi <span className="text-red">reserva</span></h2>
          <p>Ingresa el correo que usaste al reservar y te mostramos tus clases.</p>
        </div>

        <form onSubmit={handleLookup} className="lookup-form">
          <div className="lookup-input-wrap">
            <span className="lookup-input-icon" aria-hidden="true"><MailIcon /></span>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="tu@correo.com"
              required
              aria-label="Correo electrónico"
              className="lookup-input"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary lookup-btn"
            disabled={loading}
          >
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div role="alert" className="lookup-error">
            {error}
          </div>
        )}

        {hasSearched && bookings.length === 0 && !error && (
          <div className="lookup-empty">
            <div className="lookup-empty-icon" aria-hidden="true">🚴</div>
            <h4>Sin reservas con ese correo</h4>
            <p>Aún no tienes clases reservadas.</p>
            <p className="lookup-empty-cta">Verifica que el email sea el mismo que usaste al pagar o <a href="/#reservar">reserva una clase ahora</a>.</p>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="lookup-results">
            <p className="lookup-count">
              {bookings.length} {bookings.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
            </p>

            {bookings.map((b) => {
              const statusKey = b.status?.toLowerCase() || 'unknown';
              const label = STATUS_LABELS[statusKey] || statusKey;
              return (
                <article key={b.id} className="booking-card" data-status={statusKey}>
                  <div className="booking-card-head">
                    <h3>{b.class_title}</h3>
                    <span className={`status-pill status-pill--${statusKey}`}>
                      {statusKey === 'confirmed' && <CheckIcon size={12} />}
                      {label}
                    </span>
                  </div>

                  <div className="booking-card-grid">
                    <div className="booking-card-item">
                      <span className="booking-icon" aria-hidden="true"><UserIcon /></span>
                      <div className="booking-text">
                        <span className="booking-label">Instructor</span>
                        <strong>{b.instructor_name}</strong>
                      </div>
                    </div>
                    <div className="booking-card-item">
                      <span className="booking-icon" aria-hidden="true"><CalendarIcon /></span>
                      <div className="booking-text">
                        <span className="booking-label">Día</span>
                        <strong>{b.day}</strong>
                      </div>
                    </div>
                    <div className="booking-card-item">
                      <span className="booking-icon" aria-hidden="true"><AlarmClockIcon /></span>
                      <div className="booking-text">
                        <span className="booking-label">Hora</span>
                        <strong>{b.hour}</strong>
                      </div>
                    </div>
                    <div className="booking-card-item">
                      <span className="booking-icon" aria-hidden="true"><BikeIcon size={18} /></span>
                      <div className="booking-text">
                        <span className="booking-label">Bici</span>
                        <strong>#{String(b.bike_number).padStart(2, '0')} · Fila {b.bike_row}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
