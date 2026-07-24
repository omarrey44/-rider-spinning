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
  confirmation_number: string | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

// Clasifica el texto de búsqueda: correo, confirmación (8 hex), o teléfono (10+ dígitos).
type SearchKind = { kind: 'email' | 'confirmation' | 'phone'; value: string } | null;
function classifySearch(raw: string): SearchKind {
  const s = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { kind: 'email', value: s.toLowerCase() };
  if (/^[0-9A-F]{8}$/i.test(s)) return { kind: 'confirmation', value: s.toUpperCase() };
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 10) return { kind: 'phone', value: digits };
  return null;
}
function lookupBody(raw: string): Record<string, string> | null {
  const c = classifySearch(raw);
  if (!c) return null;
  return { [c.kind]: c.value };
}

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
            {isPack ? `🎟️ Pack ${membership.credits_total ?? ''} Clases` : '🚴 Membresía Ilimitada'}
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
          {isActive && !isExpired && (() => {
            const daysLeft = Math.ceil((new Date(membership.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return daysLeft <= 3
              ? <span className="membership-expiry-warn">⚠️ {daysLeft} día{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}</span>
              : <span>{daysLeft} días restantes</span>;
          })()}
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
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelErrors, setCancelErrors] = useState<Record<string, string>>({});
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const handleCancel = async (bookingId: string) => {
    const c = classifySearch(search);
    // Solo se puede cancelar identificándose por correo o teléfono.
    if (!c || c.kind === 'confirmation') return;
    setConfirmCancelId(null);
    setCancellingId(bookingId);
    setCancelErrors((prev) => { const n = { ...prev }; delete n[bookingId]; return n; });
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          ...(c.kind === 'email' ? { customer_email: c.value } : { customer_phone: c.value }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelErrors((prev) => ({ ...prev, [bookingId]: data.error || 'Error al cancelar' }));
      } else {
        handleBooked();
      }
    } catch {
      setCancelErrors((prev) => ({ ...prev, [bookingId]: 'Error inesperado. Intenta de nuevo.' }));
    } finally {
      setCancellingId(null);
    }
  };

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
      const body = lookupBody(searchTrimmed);
      if (!body) {
        setError('Ingresa un correo, teléfono (10 dígitos) o número de confirmación (8 caracteres)');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    const body = lookupBody(search);
    if (!body) return;
    fetch('/api/bookings/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
          <p>Ingresa tu correo o teléfono (o el número de confirmación) y te mostramos tus clases y membresías.</p>
        </div>

        <form onSubmit={handleLookup} className="lookup-form">
          <div className="lookup-input-wrap">
            <span className="lookup-input-icon" aria-hidden="true"><MailIcon /></span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setError(null); }}
              placeholder="Correo, teléfono o número de confirmación"
              required
              aria-label="Correo, teléfono o número de confirmación"
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
            <p>Ingresa tu correo, teléfono o número de confirmación para ver tus reservas</p>
          </div>
        )}

        {hasSearched && !hasResults && !error && (
          <div className="lookup-empty">
            <div className="lookup-empty-icon" aria-hidden="true">🚴</div>
            <h4>Sin reservas con esos datos</h4>
            <p>Aún no tienes clases reservadas ni membresías activas.</p>
            <p className="lookup-empty-cta">Verifica que el correo o teléfono sea el mismo que usaste al reservar, o <a href="/#reservar">reserva una clase ahora</a>.</p>
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
                  {b.confirmation_number && (
                    <p className="booking-card-code">Confirmación: <strong>{b.confirmation_number}</strong></p>
                  )}

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
                  {cancelErrors[b.id] && (
                    <p className="booking-cancel-error" role="alert">{cancelErrors[b.id]}</p>
                  )}
                  {(b.status === 'confirmed' || b.status === 'pending') && classifySearch(search)?.kind !== 'confirmation' && classifySearch(search) !== null && (
                    confirmCancelId === b.id ? (
                      <div className="booking-cancel-confirm">
                        <p>¿Confirmas la cancelación?</p>
                        <div className="booking-cancel-confirm-actions">
                          <button
                            className="booking-cancel-btn booking-cancel-btn--confirm"
                            onClick={() => handleCancel(b.id)}
                            disabled={cancellingId === b.id}
                          >
                            {cancellingId === b.id ? 'Cancelando…' : 'Sí, cancelar'}
                          </button>
                          <button
                            className="booking-cancel-btn booking-cancel-btn--back"
                            onClick={() => setConfirmCancelId(null)}
                          >
                            No, volver
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="booking-cancel-btn"
                        onClick={() => setConfirmCancelId(b.id)}
                      >
                        Cancelar reserva
                      </button>
                    )
                  )}
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
