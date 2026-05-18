'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const COUNTRIES = [
  { flag: '🇲🇽', name: 'México', code: '+52' },
  { flag: '🇺🇸', name: 'Estados Unidos', code: '+1' },
  { flag: '🇨🇦', name: 'Canadá', code: '+1' },
];

interface PackCheckoutModalProps {
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
        <h3>¿Cerrar compra?</h3>
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

export default function PackCheckoutModal({
  open,
  onClose,
}: PackCheckoutModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
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
    setError(null);
    setLoading(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('packCheckoutFormData');
    }
  }, []);

  const saveFormData = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('packCheckoutFormData', JSON.stringify({
        name, email, phone, countryCode
      }));
    }
  }, [name, email, phone, countryCode]);

  useEffect(() => {
    if (!open) return;
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('packCheckoutFormData');
      if (saved) {
        try {
          const { name: n, email: e, phone: p, countryCode: c } = JSON.parse(saved);
          setName(n || '');
          setEmail(e || '');
          setPhone(p || '');
          setCountryCode(c || '+52');
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
          class_title: 'Pack 5 Clases',
          pack_size: 5,
          pack_price: 950,
          amount_cents: 95000,
          currency: 'MXN',
          test_mode: testMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la sesión de pago');
      }

      reset();

      if (data.test_mode) {
        window.location.href = `/reserva-exitosa?test=true&customer_name=${encodeURIComponent(name.trim())}&customer_email=${encodeURIComponent(email.trim())}&customer_phone=${encodeURIComponent(fullPhone)}&class_title=${encodeURIComponent('Pack 5 Clases')}&amount=${95000 / 100}`;
      } else {
        window.location.href = data.checkout_url;
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
      aria-label="Comprar pack"
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
          <span className="modal-eyebrow">Compra de pack</span>
          <h3>Pack 5 clases</h3>
        </div>

        <div className="modal-summary">
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" /></svg>
              Producto
            </span>
            <strong>5 clases · 30 días</strong>
          </div>
          <div className="summary-row">
            <span className="summary-icon-label">
              <svg className="summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              Beneficios
            </span>
            <strong>Cancela hasta 2h antes</strong>
          </div>
          <div className="summary-divider" />
          <div className="summary-row total">
            <span>Total</span>
            <strong>$950 MXN</strong>
          </div>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pack-name">Nombre completo</label>
            <input
              id="pack-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pack-email">Correo electrónico</label>
            <div className="input-wrapper">
              <input
                id="pack-email"
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
                id="pack-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="1234567890"
                required
                maxLength={10}
              />
            </div>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <p className="form-note">
            Te enviaremos la confirmación de tu compra por correo.
          </p>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block btn-shimmer"
            disabled={loading}
          >
            {loading && <span className="loading-spinner" />}
            {loading ? 'Redirigiendo a pago...' : 'Pagar pack'}
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
