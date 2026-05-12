'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

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
          subscription_type: 'monthly',
          amount_cents: 240000,
          currency: 'MXN',
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
          <div className="modal-progress">
            <span className="modal-progress-step">Paso 1 de 2</span>
            <div className="modal-progress-bar">
              <div className="modal-progress-fill" />
            </div>
          </div>
          <span className="modal-eyebrow">Mensualidad</span>
          <h3>Suscripción ilimitada</h3>
        </div>

        <div className="modal-summary">
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18l-1.5-9-4.5 4-3-6-3 6-4.5-4L3 18z"/><path d="M3 22h18"/></svg>
              Plan
            </span>
            <strong>Clases ilimitadas</strong>
          </div>
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              Beneficios
            </span>
            <strong>Botella + toalla cortesía</strong>
          </div>
          <div className="summary-divider" />
          <div className="summary-row total">
            <span>Total mensual</span>
            <strong>$2,400 MXN</strong>
          </div>
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
          </div>

          <div className="form-group">
            <label htmlFor="sub-phone">Teléfono <span className="optional">(opcional)</span></label>
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
                id="sub-phone"
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
            Se renovará automáticamente cada mes. Puedes cancelar en cualquier momento.
          </p>

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
