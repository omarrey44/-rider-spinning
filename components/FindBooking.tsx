'use client';

import { useState, useEffect } from 'react';
import { MailIcon, BikeIcon, UserIcon, CalendarIcon, AlarmClockIcon, CheckIcon } from './Icons';
import MembershipBookingModal, { MembershipData } from './MembershipBookingModal';
import type { MaintenanceState } from '@/lib/maintenance';

const pesos = (cents: number) => `$${(cents / 100).toLocaleString('es-MX')}`;

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
  expired: 'Expirada',
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

// Fecha (YYYY-MM-DD) y minutos desde medianoche AHORA, en hora Chihuahua.
function chihuahuaNow(): { dateISO: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chihuahua',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  const dateISO = `${get('year')}-${get('month')}-${get('day')}`;
  let hh = parseInt(get('hour'), 10);
  if (hh === 24) hh = 0; // algunos motores devuelven 24 a medianoche
  const minutes = hh * 60 + parseInt(get('minute'), 10);
  return { dateISO, minutes };
}

// Convierte "09:00 AM" a minutos desde medianoche (o null si no parsea).
function hourToMinutes(hour: string): number | null {
  const m = hour.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const per = m[3].toUpperCase();
  if (per === 'PM' && h !== 12) h += 12;
  if (per === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

// true si la clase ya pasó (por fecha Y hora, hora Chihuahua).
// Ej: reservó 09:00 AM y ya son 11:00 AM del mismo día → finalizada.
function isFinishedBooking(classDate: string | null, hour: string): boolean {
  if (!classDate) return false;
  const { dateISO, minutes } = chihuahuaNow();
  if (classDate < dateISO) return true;
  if (classDate > dateISO) return false;
  const classMin = hourToMinutes(hour);
  if (classMin === null) return false;
  return minutes >= classMin;
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
  // Pack sin créditos = agotado (aunque siga 'active' y vigente).
  const packExhausted = isPack && creditsLeft !== null && creditsLeft <= 0;
  const effectiveStatus = isExpired
    ? 'expired'
    : packExhausted
      ? 'exhausted'
      : membership.status;

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [maint, setMaint] = useState<MaintenanceState | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Carga el estado de la cuota de mantenimiento (solo suscripciones activas).
  useEffect(() => {
    if (isPack || !isActive || isExpired) return;
    let cancelled = false;
    (async () => {
      try {
        const p = new URLSearchParams({
          email: membership.customer_email,
          confirmation: membership.confirmation_number,
        });
        const r = await fetch(`/api/memberships/maintenance?${p}`);
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled && d.state) setMaint(d.state);
      } catch {
        /* silencioso */
      }
    })();
    return () => { cancelled = true; };
  }, [membership.customer_email, membership.confirmation_number, isPack, isActive, isExpired]);

  // Manda al cliente a Stripe a pagar la cuota adeudada.
  const payMaintenance = async () => {
    setPayError(null);
    setPayLoading(true);
    try {
      const res = await fetch('/api/memberships/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: membership.customer_email,
          confirmation_number: membership.confirmation_number,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago');
      window.location.href = data.url;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Error inesperado');
      setPayLoading(false);
    }
  };

  // Abre el Stripe Billing Portal para administrar/cancelar la suscripción.
  const openPortal = async () => {
    setPortalError(null);
    setPortalLoading(true);
    try {
      const res = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: membership.customer_email,
          confirmation_number: membership.confirmation_number,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo abrir el portal');
      window.location.href = data.url;
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Error inesperado');
      setPortalLoading(false);
    }
  };

  return (
    <article className={`membership-card membership-card--${effectiveStatus}`}>
      <div className="membership-card-head">
        <div className="membership-card-title">
          <span className={`membership-badge membership-badge--${membership.type}`}>
            {isPack ? `🎟️ Pack ${membership.credits_total ?? ''} Clases` : '🚴 Membresía Ilimitada'}
          </span>
          <span className={`status-pill status-pill--${effectiveStatus === 'active' ? 'confirmed' : effectiveStatus === 'exhausted' ? 'finished' : 'cancelled'}`}>
            {effectiveStatus === 'active' ? 'Activa'
              : effectiveStatus === 'exhausted' ? 'Créditos agotados'
              : effectiveStatus === 'expired' ? 'Expirada' : 'Cancelada'}
          </span>
        </div>
        {membership.customer_name && (
          <p className="membership-card-name">A nombre de <strong>{membership.customer_name}</strong></p>
        )}
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
          <>
            <p className="membership-limit-text">1 clase por día · clases ilimitadas</p>
            <p className="membership-renew-text">🔄 Se renueva automáticamente cada mes · cancela cuando quieras</p>
          </>
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

      {/* Cuota de mantenimiento (solo suscripción con adeudo) */}
      {maint && maint.applies && maint.owedCents > 0 && (
        <div className={`membership-maint ${maint.blocked ? 'membership-maint--blocked' : ''}`} role={maint.blocked ? 'alert' : 'note'}>
          <p className="membership-maint-title">
            {maint.blocked ? '🚫 Reservas bloqueadas' : '🔧 Cuota de mantenimiento'}
          </p>
          <p className="membership-maint-text">
            {maint.blocked
              ? <>Tienes <strong>{pesos(maint.owedCents)}</strong> de cuota de mantenimiento pendiente. Págala para volver a reservar.</>
              : <>Esta semana puedes pagar tu cuota de mantenimiento: <strong>{pesos(maint.owedCents)}</strong>. Puedes omitirla esta semana.</>}
          </p>
          <button className="btn btn-primary btn-block membership-maint-btn" onClick={payMaintenance} disabled={payLoading}>
            {payLoading ? 'Abriendo pago…' : `Pagar cuota ${pesos(maint.owedCents)}`}
          </button>
          {payError && <p className="membership-manage-error" role="alert">{payError}</p>}
        </div>
      )}

      {isActive && !isExpired && !packExhausted && !(maint?.blocked) && (
        <button
          className="btn btn-primary btn-block membership-book-btn"
          onClick={() => onBook(membership)}
        >
          Reservar clase con {isPack ? 'este pack' : 'membresía'}
        </button>
      )}

      {packExhausted && !isExpired && (
        <p className="membership-expired-msg">Ya usaste las 3 clases de tu pack. Compra otro pack para seguir reservando.</p>
      )}

      {!isPack && isActive && !isExpired && (
        <>
          <button
            className="membership-manage-btn"
            onClick={openPortal}
            disabled={portalLoading}
          >
            {portalLoading ? 'Abriendo…' : 'Administrar o cancelar suscripción'}
          </button>
          {portalError && <p className="membership-manage-error" role="alert">{portalError}</p>}
        </>
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
  const [cancelSuccess, setCancelSuccess] = useState<Record<string, string>>({});
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
        setCancelSuccess((prev) => ({
          ...prev,
          [bookingId]: data.refunded
            ? 'Reserva cancelada. Procesamos tu reembolso completo; puede tardar de 5 a 10 días hábiles en reflejarse en tu método de pago.'
            : 'Reserva cancelada y tu lugar fue liberado. Según la política, esta cancelación no genera reembolso.',
        }));
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

      setBookings((data.bookings || []).filter((b: Booking) => b.status !== 'expired'));
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
        setBookings((data.bookings || []).filter((b: Booking) => b.status !== 'expired'));
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
          <p>Ingresa tu correo o teléfono (o el número de confirmación) para ver tus clases y membresías. Aquí también puedes <strong>cancelar una reserva</strong>.</p>
        </div>

        <div className="lookup-membership-hint" role="note">
          <span className="lookup-membership-icon" aria-hidden="true">🎟️</span>
          <p>
            <strong>¿Tienes un Pack o una Mensualidad?</strong> Aquí es donde reservas tus clases.
            Ingresa el <strong>correo o teléfono</strong> con el que compraste y elige tu horario y bici con tu membresía.
          </p>
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
            <div className="lookup-group-head">
              <h3 className="lookup-group-title">🎟️ Tus membresías · reserva tus clases aquí</h3>
              <p className="lookup-count">
                {memberships.length === 1 ? '1 membresía activa' : `${memberships.length} membresías activas`}
              </p>
            </div>
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
          <div className="lookup-results" style={{ marginTop: memberships.length > 0 ? 40 : 0 }}>
            <div className="lookup-group-head">
              <h3 className="lookup-group-title">🚴 Tus clases reservadas</h3>
              <p className="lookup-count">
                {bookings.length} {bookings.length === 1 ? 'reserva' : 'reservas'}
              </p>
            </div>

            {bookings.map((b) => {
              const rawKey = b.status?.toLowerCase() || 'unknown';
              // Una reserva confirmada cuya fecha y hora ya pasaron → "Finalizada".
              const isFinished = rawKey === 'confirmed' && isFinishedBooking(b.class_date, b.hour);
              const statusKey = isFinished ? 'finished' : rawKey;
              const label = isFinished ? 'Finalizada' : (STATUS_LABELS[rawKey] || rawKey);
              return (
                <article key={b.id} className="booking-card" data-status={statusKey}>
                  <div className="booking-card-head">
                    <h3>{b.class_title}</h3>
                    <span className={`status-pill status-pill--${statusKey}`}>
                      {(statusKey === 'confirmed' || isFinished) && <CheckIcon size={12} />}
                      {label}
                    </span>
                  </div>
                  {b.customer_name && (
                    <p className="booking-card-name">A nombre de <strong>{b.customer_name}</strong></p>
                  )}
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
                  {cancelSuccess[b.id] && (
                    <p className="booking-cancel-success" role="status">{cancelSuccess[b.id]}</p>
                  )}
                  {(b.status === 'confirmed' || b.status === 'pending') && !isFinishedBooking(b.class_date, b.hour) && classifySearch(search)?.kind !== 'confirmation' && classifySearch(search) !== null && (
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
