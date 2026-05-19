'use client';

import { useState, useEffect } from 'react';
import { MailIcon, BikeIcon, UserIcon, CalendarIcon, AlarmClockIcon, CheckIcon } from './Icons';
import MembershipBookingModal, { MembershipData } from './MembershipBookingModal';

interface Booking {
  id: string;
  customer_name: string;
  bike_number: number;
  bike_row: number;
  class_title: string;
  instructor_name: string;
  day: string;
  hour: string;
  class_date: string | null;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

const formatFullDate = (classDate: string | null, day: string): string => {
  if (!classDate) return day;
  try {
    const date = new Date(classDate + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return day;
  }
};

function formatExpiry(isoDate: string) {
  try {
    return new Date(isoDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoDate;
  }
}

function MembershipCard({
  membership,
  onBook,
}: {
  membership: MembershipData;
  onBook: (m: MembershipData) => void;
}) {
  const isPack = membership.type === 'pack';
  const creditsLeft = isPack && membership.credits_total !== null
    ? membership.credits_total - membership.credits_used
    : null;
  const isActive = membership.status === 'active';
  const isExpired = new Date(membership.expires_at) < new Date();
  const effectiveStatus = isExpired ? 'expired' : membership.status;

  return (
    <article className={`membership-card membership-card--${effectiveStatus}`}>
      <div className="membership-card-head">
        <div className="membership-card-title">
          <span className={`membership-badge membership-badge--${membership.type}`}>
            {isPack ? '🎟️ Pack 3 Clases' : '🚴 Membresía Ilimitada'}
          </span>
          <span className={`status-pill status-pill--${effectiveStatus === 'active' ? 'confirmed' : 'cancelled'}`}>
            {effectiveStatus === 'active' ? 'Activa' : effectiveStatus === 'expired' ? 'Expirada' : 'Cancelada'}
          </span>
        </div>
      </div>

      <div className="membership-card-body">
        {isPack && creditsLeft !== null && (
          <div className="membership-credits">
            <div className="membership-credits-bar">
              {Array.from({ length: membership.credits_total! }).map((_, i) => (
                <div
                  key={i}
                  className={`membership-credit-dot ${i < membership.credits_used ? 'used' : 'available'}`}
                />
              ))}
            </div>
            <span className="membership-credits-text">
              <strong>{creditsLeft}</strong> de {membership.credits_total} crédito{membership.credits_total !== 1 ? 's' : ''} disponible{creditsLeft !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {!isPack && (
          <p className="membership-limit-text">1 clase por día · clases ilimitadas</p>
        )}

        <div className="membership-meta">
          <span>Código: <strong>{membership.confirmation_number}</strong></span>
          <span>Vence: <strong>{formatExpiry(membership.expires_at)}</strong></span>
        </div>
      </div>

      {isActive && !isExpired && (
        <button
          className="btn btn-primary btn-block membership-book-btn"
          onClick={() => onBook(membership)}
        >
          Reservar clase con {isPack ? 'este pack' : 'membresía'}
        </button>
      )}

      {(!isActive || isExpired) && (
        <p className="membership-expired-msg">
          {isExpired ? 'Esta membresía ha expirado.' : 'Esta membresía no está activa.'}
        </p>
      )}
    </article>
  );
}

export default function FindBooking() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [memberships, setMemberships] = useState<MembershipData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookingMembership, setBookingMembership] = useState<MembershipData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setSearch(decodeURIComponent(emailParam));
      }
    }
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBookings([]);
    setMemberships([]);
    setHasSearched(false);

    const searchTrimmed = search.trim();
    if (!searchTrimmed) {
      setError('Ingresa un correo o número de confirmación');
      return;
    }

    setLoading(true);

    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchTrimmed);
      const isConfirmation = /^[0-9A-F]{8}$/i.test(searchTrimmed);

      if (!isEmail && !isConfirmation) {
        setError('Ingresa un correo válido o número de confirmación (8 caracteres)');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEmail
            ? { email: searchTrimmed.toLowerCase() }
            : { confirmation: searchTrimmed.toUpperCase() }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al buscar');
      }

      setBookings(data.bookings || []);
      setMemberships(data.memberships || []);
      setHasSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBooked = () => {
    // Re-run lookup to refresh credits count
    const searchTrimmed = search.trim();
    if (!searchTrimmed) return;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchTrimmed);
    fetch('/api/bookings/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isEmail
          ? { email: searchTrimmed.toLowerCase() }
          : { confirmation: searchTrimmed.toUpperCase() }
      ),
    })
      .then((r) => r.json())
      .then((data) => {
        setBookings(data.bookings || []);
        setMemberships(data.memberships || []);
      })
      .catch(() => {});
  };

  const hasResults = bookings.length > 0 || memberships.length > 0;

  return (
    <section className="find-booking" id="mis-reservas">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Mis reservas</span>
          <h2>Buscar mi <span className="text-red">reserva</span></h2>
          <p>Ingresa el correo que usaste al reservar y te mostramos tus clases y membresías.</p>
        </div>

        <form onSubmit={handleLookup} className="lookup-form">
          <div className="lookup-input-wrap">
            <span className="lookup-input-icon" aria-hidden="true"><MailIcon /></span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setError(null); }}
              placeholder="tu@correo.com o número de confirmación"
              required
              aria-label="Correo o número de confirmación"
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

        {!hasSearched && !error && (
          <div className="lookup-prompt">
            <div className="lookup-prompt-icon" aria-hidden="true">🔍</div>
            <p>Ingresa el correo o número de confirmación para ver tus reservas</p>
          </div>
        )}

        {hasSearched && !hasResults && !error && (
          <div className="lookup-empty">
            <div className="lookup-empty-icon" aria-hidden="true">🚴</div>
            <h4>Sin reservas con ese correo</h4>
            <p>Aún no tienes clases reservadas ni membresías activas.</p>
            <p className="lookup-empty-cta">Verifica que el email sea el mismo que usaste al pagar o <a href="/#reservar">reserva una clase ahora</a>.</p>
          </div>
        )}

        {memberships.length > 0 && (
          <div className="lookup-results">
            <p className="lookup-count">
              {memberships.length === 1 ? '1 membresía' : `${memberships.length} membresías`} encontrada{memberships.length !== 1 ? 's' : ''}
            </p>
            {memberships.map((m) => (
              <MembershipCard
                key={m.id}
                membership={m}
                onBook={setBookingMembership}
              />
            ))}
          </div>
        )}

        {bookings.length > 0 && (
          <div className="lookup-results" style={{ marginTop: memberships.length > 0 ? 32 : 0 }}>
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
                        <strong>{formatFullDate(b.class_date, b.day)}</strong>
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

      {bookingMembership && (
        <MembershipBookingModal
          membership={bookingMembership}
          onClose={() => setBookingMembership(null)}
          onBooked={handleBooked}
        />
      )}
    </section>
  );
}
