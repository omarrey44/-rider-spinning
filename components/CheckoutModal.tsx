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

interface ConfirmCloseProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmCloseDialog({ show, onConfirm, onCancel }: ConfirmCloseProps) {
  if (!show) return null;
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>¿Cerrar reserva?</h3>
        <p>Se perderán los datos que ingresaste.</p>
        <div className="confirm-actions">
          <button className="btn btn-outline" onClick={onCancel}>
            Continuar
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
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
  const [countryCode, setCountryCode] = useState('+52');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const hasData = !!(name.trim() || email.trim() || phone.trim());

  const countries = [
    { code: '+52', flag: '🇲🇽', name: 'México' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+1', flag: '🇨🇦', name: 'Canada' },
  ];

  const isEmailValid = email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          if (hasData) {
            setShowConfirmClose(true);
          } else {
            onClose();
          }
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Reservar clase"
    >
      <div className="modal">
        <button
          className="modal-close"
          onClick={() => hasData ? setShowConfirmClose(true) : onClose()}
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
            <div className="input-wrapper">
              <input
                id="guest-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
              {email && (
                <div className={`input-validation-icon ${isEmailValid ? 'valid' : 'invalid'}`}>
                  {isEmailValid ? '✓' : '✕'}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="guest-phone">Teléfono <span className="optional">(opcional)</span></label>
            <div className="phone-input-wrapper">
              <button
                type="button"
                className="country-code-btn"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                aria-label="Seleccionar país"
              >
                {countries.find(c => c.code === countryCode)?.flag || '🇲🇽'}
                <span className="country-code">{countryCode}</span>
              </button>
              <input
                id="guest-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="614 123 4567"
                autoComplete="tel"
              />
              {showCountryPicker && (
                <div className="country-picker-dropdown">
                  {countries.map((c) => (
                    <button
                      key={c.code + c.name}
                      type="button"
                      className="country-option"
                      onClick={() => {
                        setCountryCode(c.code);
                        setShowCountryPicker(false);
                      }}
                    >
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="code">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
            className="btn btn-primary btn-lg btn-block btn-shimmer"
            disabled={loading}
          >
            {loading && <span className="loading-spinner" />}
            {loading ? 'Redirigiendo a pago...' : 'Pagar y reservar'}
          </button>
        </form>
      </div>

      <ConfirmCloseDialog
        show={showConfirmClose}
        onConfirm={onClose}
        onCancel={() => setShowConfirmClose(false)}
      />
    </div>
  );
}
