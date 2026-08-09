'use client';

import { useState } from 'react';

export default function Feedback() {
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!message.trim() || message.trim().length < 5) {
      setError('Escribe un mensaje más detallado');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo válido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="waitlist" id="feedback">
      <div className="container waitlist-container">
        <div className="waitlist-card">
          <span className="waitlist-eyebrow">Atención al cliente</span>
          <h2 className="waitlist-title">
            Quejas y <span className="text-red">sugerencias</span>
          </h2>
          <p className="waitlist-sub">
            ¿Algo no estuvo bien o tienes una idea? Escríbenos — leemos todo y respondemos.
          </p>

          {done ? (
            <div className="feedback-success">
              <div className="check-circle check-green" style={{ width: 48, height: 48, margin: '0 auto 16px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 style={{ color: '#fff', marginBottom: 8 }}>¡Mensaje enviado!</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                Lo recibimos. Si dejaste tu correo, te respondemos pronto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="feedback-field">
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setError(null); }}
                  placeholder="Cuéntanos qué pasó o qué mejorarías…"
                  rows={4}
                  required
                  aria-label="Mensaje"
                  className="feedback-textarea"
                  disabled={loading}
                />
              </div>
              <div className="feedback-field">
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
                {loading ? 'Enviando…' : 'Enviar mensaje'}
              </button>
            </form>
          )}

          {error && <p className="waitlist-error" role="alert">{error}</p>}
        </div>
      </div>
    </section>
  );
}
