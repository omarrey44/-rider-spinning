'use client';

import { useState } from 'react';
import { MailIcon, CheckIcon } from './Icons';

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<'new' | 'duplicate' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo válido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'landing' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar');
      }
      setDone(data.already_registered ? 'duplicate' : 'new');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="waitlist" id="waitlist">
      <div className="container waitlist-container">
        <div className="waitlist-card">
          <span className="waitlist-eyebrow">● Pre-launch</span>
          <h2 className="waitlist-title">
            Sé de los <span className="text-red">primeros</span> en pedalear
          </h2>
          <p className="waitlist-sub">
            Apúntate a la lista de espera. Te avisamos en cuanto abramos las puertas — sin spam, solo el aviso.
          </p>

          {done ? (
            <div className="waitlist-done" role="status">
              <span className="waitlist-done-icon"><CheckIcon size={20} /></span>
              <div>
                <strong>
                  {done === 'duplicate' ? 'Ya estás en la lista' : '¡Listo, estás dentro!'}
                </strong>
                <span>
                  {done === 'duplicate'
                    ? 'Tu correo ya estaba registrado. Te avisamos cuando abramos.'
                    : 'Te enviaremos el aviso de apertura a tu correo.'}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="waitlist-form">
              <div className="waitlist-input-wrap">
                <span className="waitlist-input-icon" aria-hidden="true"><MailIcon /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="tu@correo.com"
                  required
                  aria-label="Correo electrónico"
                  className="waitlist-input"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary waitlist-btn"
                disabled={loading}
              >
                {loading ? 'Registrando…' : 'Avísame'}
              </button>
            </form>
          )}

          {error && (
            <p className="waitlist-error" role="alert">{error}</p>
          )}

          <p className="waitlist-privacy">
            Al registrarte aceptas nuestro <a href="/privacidad">aviso de privacidad</a>. Solo te escribimos para avisar la apertura.
          </p>
        </div>
      </div>
    </section>
  );
}
