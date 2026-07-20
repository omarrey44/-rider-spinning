'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const COUNTRIES = [
  { flag: '🇲🇽', name: 'México', code: '+52' },
  { flag: '🇺🇸', name: 'Estados Unidos', code: '+1' },
  { flag: '🇨🇦', name: 'Canadá', code: '+1' },
];

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
  classDate: string;
  /** Evento gratuito (Gran Apertura): omite Stripe y confirma directo. */
  isFree?: boolean;
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
  priceCents,
  currency,
  classDate,
  isFree,
}: CheckoutModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
  const [goal, setGoal] = useState('');
  const [goalCustom, setGoalCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const hasData = !!(name.trim() || email.trim() || phone.trim());

  const isEmailValid = email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const reset = useCallback(() => {
    setName('');
    setEmail('');
    setPhone('');
    setCountryCode('+52');
    setGoal('');
    setGoalCustom('');
    setError(null);
    setLoading(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('checkoutFormData');
    }
  }, []);

  const saveFormData = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('checkoutFormData', JSON.stringify({
        name, email, phone, countryCode, goal, goalCustom
      }));
    }
  }, [name, email, phone, countryCode, goal, goalCustom]);

  useEffect(() => {
    if (!open) return;
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('checkoutFormData');
      if (saved) {
        try {
          const { name: n, email: e, phone: p, countryCode: c, goal: g, goalCustom: gc } = JSON.parse(saved);
          setName(n || '');
          setEmail(e || '');
          setPhone(p || '');
          setCountryCode(c || '+52');
          setGoal(g || '');
          setGoalCustom(gc || '');
        } catch {
          // Invalid data, ignore
        }
      }
    }

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
      saveFormData();
    }
  }, [open, saveFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Nombre, correo y teléfono son obligatorios');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Ingresa un teléfono válido (10 dígitos)');
      return;
    }

    setLoading(true);

    try {
      const testMode = typeof window !== 'undefined' && sessionStorage.getItem('test_mode') === 'true';
      const fullPhone = `${countryCode}${phone.trim()}`;
      const goalValue = goal === 'Otro' ? (goalCustom.trim() || 'Otro') : (goal.trim() || undefined);

      // Evento gratuito (Gran Apertura): endpoint dedicado, sin Stripe.
      const res = isFree
        ? await fetch('/api/bookings/free', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name: name.trim(),
              customer_email: email.trim(),
              customer_phone: fullPhone,
              bike_number: bikeNumber,
              bike_row: bikeRow,
              class_title: classTitle,
              instructor_name: instructorName,
              hour,
              goal: goalValue,
            }),
          })
        : await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name: name.trim(),
              customer_email: email.trim(),
              customer_phone: fullPhone,
              bike_number: bikeNumber,
              bike_row: bikeRow,
              class_title: classTitle,
              instructor_name: instructorName,
              date_time: dateTime,
              class_date: classDate,
              day,
              hour,
              amount_cents: priceCents,
              currency,
              test_mode: testMode,
              goal: goalValue,
            }),
          });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isFree ? 'Error al confirmar tu reserva' : 'Error al crear la sesión de pago'));
      }

      reset();

      if (data.free || data.test_mode) {
        // Reserva confirmada sin Stripe (evento gratuito o modo prueba).
        const flag = data.free ? 'free=true' : 'test=true';
        window.open(`/reserva-exitosa?${flag}&customer_name=${encodeURIComponent(name.trim())}&customer_email=${encodeURIComponent(email.trim())}&customer_phone=${encodeURIComponent(fullPhone)}&class_title=${encodeURIComponent(classTitle)}&instructor_name=${encodeURIComponent(instructorName)}&day=${encodeURIComponent(day)}&hour=${encodeURIComponent(hour)}&bike_number=${bikeNumber}&bike_row=${bikeRow}&amount=${priceCents / 100}`, '_blank');
      } else {
        window.open(data.checkout_url, '_blank');
      }
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
          <span className="modal-eyebrow">{isFree ? 'Reserva gratuita' : 'Checkout rápido'}</span>
          <h3>Tu reserva</h3>
        </div>

        <div className="modal-booking-banner">
          <div className="booking-banner-row">
            <span className="booking-banner-class">{classTitle}</span>
            <span className="booking-banner-bike">Bici #{String(bikeNumber).padStart(2, '0')} · Fila {bikeRow}</span>
          </div>
          <div className="booking-banner-row">
            <span className="booking-banner-datetime">{dateTime}</span>
            <span className="booking-banner-price">{isFree ? 'Gratis' : `$${(priceCents / 100).toLocaleString('es-MX')} ${currency}`}</span>
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
            <label>Teléfono</label>
            <div className="phone-input-group">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="country-select"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.name} value={country.code}>
                    {country.flag} {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <input
                id="guest-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="1234567890"
                required
                maxLength={10}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="guest-goal">¿Cuál es tu objetivo? <span className="optional">(opcional)</span></label>
            <div className="goal-select-wrap">
              <select
                id="guest-goal"
                className="goal-select"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="">Selecciona tu meta...</option>
                <option value="Perder peso">🔥 Perder peso</option>
                <option value="Ganar resistencia / cardio">❤️ Ganar resistencia / cardio</option>
                <option value="Tonificar">💪 Tonificar</option>
                <option value="Manejo del estrés">🧘 Manejo del estrés</option>
                <option value="Diversión y socializar">🎉 Diversión y socializar</option>
                <option value="Otro">✏️ Otro...</option>
              </select>
              <svg className="goal-select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            {goal === 'Otro' && (
              <input
                type="text"
                className="goal-custom-input"
                value={goalCustom}
                onChange={(e) => setGoalCustom(e.target.value)}
                placeholder="Cuéntanos tu objetivo..."
                autoFocus
                maxLength={120}
              />
            )}
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <div className="trust-badges">
            <span className="trust-badge">{isFree ? '🎁 Clase sin costo' : '🔒 Pago seguro'}</span>
            <span className="trust-badge">↩️ Cancelable hasta 1h antes</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block btn-shimmer"
            disabled={loading}
          >
            {loading && <span className="loading-spinner" />}
            {isFree
              ? (loading ? 'Confirmando reserva...' : 'Reservar gratis')
              : (loading ? 'Redirigiendo a pago...' : 'Pagar y reservar')}
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
