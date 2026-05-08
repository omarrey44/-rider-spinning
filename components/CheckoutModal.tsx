'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  bikeNumber: number;
  bikeRow: number;
  className: string;
  instructorName: string;
  /** Display string para Stripe receipt (ej. "Lunes 5 mayo 06:00 AM") */
  dateTime: string;
  /** Día de la semana (ej. "Lunes") — se guarda en BD */
  day: string;
  /** Hora con AM/PM (ej. "06:00 AM") — se guarda en BD */
  hour: string;
  duration: string;
  priceCents: number;
  currency: string;
}

export default function CheckoutModal({
  open,
  onClose,
  bikeNumber,
  bikeRow,
  className: classTitle,
  instructorName,
  dateTime,
  day,
  hour,
  duration,
  priceCents,
  currency,
}: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setName('');
    setEmail('');
    setPhone('');
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Nombre y correo son obligatorios');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim() || undefined,
          bike_number: bikeNumber,
          bike_row: bikeRow,
          class_title: classTitle,
          instructor_name: instructorName,
          date_time: dateTime,
          day,
          hour,
          amount_cents: priceCents,
          currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la sesión de pago');
      }

      window.location.href = data.checkout_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Reservar clase"
    >
      <div className="modal">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className="modal-header">
          <span className="modal-eyebrow">Checkout rápido</span>
          <h3>Tu reserva</h3>
        </div>

        <div className="modal-summary">
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Clase
            </span>
            <strong>{classTitle}</strong>
          </div>
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Instructor
            </span>
            <strong>{instructorName}</strong>
          </div>
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Fecha
            </span>
            <strong>{dateTime}</strong>
          </div>
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Duración
            </span>
            <strong>{duration}</strong>
          </div>
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 17.5V8l4-3v12.5"/><path d="M5.5 17.5L9 8h6l3-3"/></svg>
              Bici
            </span>
            <strong>#{String(bikeNumber).padStart(2, '0')} · Fila {bikeRow}</strong>
          </div>
          <div className="summary-divider" />
          <div className="summary-row total">
            <span>Total</span>
            <strong>${(priceCents / 100).toLocaleString('es-MX')} {currency}</strong>
          </div>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="guest-name">Nombre completo</label>
            <input
              id="guest-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="guest-email">Correo electrónico</label>
            <input
              id="guest-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="guest-phone">Teléfono <span className="optional">(opcional)</span></label>
            <input
              id="guest-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 614 123 4567"
              autoComplete="tel"
            />
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <p className="form-note">
            Te enviaremos la confirmación de tu reserva por correo.
          </p>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
          >
            {loading && <span className="loading-spinner" />}
            {loading ? 'Redirigiendo a pago...' : 'Pagar y reservar'}
          </button>
        </form>
      </div>
    </div>
  );
}
