'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { suggestEmail } from '@/lib/email-suggest';

const COUNTRIES = [
  { flag: '🇲🇽', name: 'México', code: '+52' },
  { flag: '🇺🇸', name: 'Estados Unidos', code: '+1' },
  { flag: '🇨🇦', name: 'Canadá', code: '+1' },
];

interface SubscriptionCheckoutModalProps {
  open: boolean;
  onClose: () => void;
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
        <h3>¿Cerrar suscripción?</h3>
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

export default function SubscriptionCheckoutModal({
  open,
  onClose,
}: SubscriptionCheckoutModalProps) {
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
      sessionStorage.removeItem('subscriptionCheckoutFormData');
    }
  }, []);

  const saveFormData = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('subscriptionCheckoutFormData', JSON.stringify({
        name, email, phone, countryCode, goal, goalCustom
      }));
    }
  }, [name, email, phone, countryCode, goal, goalCustom]);

  useEffect(() => {
    if (!open) return;
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('subscriptionCheckoutFormData');
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

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: fullPhone,
          class_title: 'Mensualidad Ilimitada',
          subscription_type: 'monthly',
          amount_cents: 65000,
          currency: 'MXN',
          test_mode: testMode,
          goal: goal === 'Otro' ? (goalCustom.trim() || 'Otro') : (goal.trim() || undefined),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la sesión de pago');
      }

      reset();

      if (data.test_mode) {
        window.open(`/reserva-exitosa?test=true&customer_name=${encodeURIComponent(name.trim())}&customer_email=${encodeURIComponent(email.trim())}&customer_phone=${encodeURIComponent(fullPhone)}&class_title=${encodeURIComponent('Mensualidad Ilimitada')}&amount=${65000 / 100}`, '_blank');
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
      aria-label="Suscribirse"
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
          <span className="modal-eyebrow">Mensualidad</span>
          <h3>Suscripción ilimitada</h3>
        </div>

        <div className="modal-booking-banner">
          <div className="booking-banner-row">
            <span className="booking-banner-class">Mensualidad Ilimitada</span>
            <span className="booking-banner-bike">Clases ilimitadas</span>
          </div>
          <div className="booking-banner-row">
            <span className="booking-banner-datetime">Botella + toalla · Cancela cuando quieras</span>
            <span className="booking-banner-price">$650 MXN/mes</span>
          </div>
          <p className="banner-sub-note">🎉 Sin inscripción este mes (desde septiembre $250) · + $250 MXN mantenimiento semestral</p>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sub-name">Nombre completo</label>
            <input
              id="sub-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sub-email">Correo electrónico</label>
            <div className="input-wrapper">
              <input
                id="sub-email"
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
            {suggestEmail(email) && (
              <button type="button" className="email-suggest" onClick={() => setEmail(suggestEmail(email)!)}>
                ¿Quisiste decir <strong>{suggestEmail(email)}</strong>?
              </button>
            )}
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
                id="sub-phone"
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
            <label htmlFor="sub-goal">¿Cuál es tu objetivo? <span className="optional">(opcional)</span></label>
            <div className="goal-select-wrap">
              <select
                id="sub-goal"
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
            <span className="trust-badge">🔒 Pago seguro</span>
            <span className="trust-badge">↩️ Cancela cuando quieras</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block btn-shimmer"
            disabled={loading}
          >
            {loading && <span className="loading-spinner" />}
            {loading ? 'Redirigiendo a pago...' : 'Suscribirse'}
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
