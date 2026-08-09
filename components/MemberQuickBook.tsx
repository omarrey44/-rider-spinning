'use client';

import { useState } from 'react';
import MembershipBookingModal, { MembershipData } from './MembershipBookingModal';

// Atajo para clientes con Pack/Mensualidad: ingresan su correo o teléfono
// y reservan su bici sin pagar de nuevo (usa su membresía activa).
function classify(raw: string): { email?: string; phone?: string; confirmation?: string } | null {
  const s = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { email: s.toLowerCase() };
  if (/^[0-9A-F]{8}$/i.test(s)) return { confirmation: s.toUpperCase() };
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 10) return { phone: digits };
  return null;
}

// Membresía usable: activa, no expirada y (si es pack) con créditos disponibles.
function isUsable(m: MembershipData): boolean {
  if (m.status !== 'active') return false;
  if (new Date(m.expires_at) < new Date()) return false;
  if (m.type === 'pack' && m.credits_total !== null && m.credits_used >= m.credits_total) return false;
  return true;
}

export default function MemberQuickBook() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const body = classify(value);
    if (!body) {
      setMsg('Ingresa el correo o teléfono con el que compraste tu membresía.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al buscar');
      const usable = (data.memberships || []).filter(isUsable);
      if (usable.length === 0) {
        setMsg('No encontramos una membresía o pack activo con esos datos. Revisa "Mis reservas" o adquiere uno en Precios.');
        return;
      }
      // Prioriza pack (consume créditos) para que no venzan; si no, la primera activa.
      const chosen = usable.find((m: MembershipData) => m.type === 'pack') ?? usable[0];
      setMembership(chosen);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="member-quick container">
      <div className="member-quick-inner">
        <div className="member-quick-head">
          <span className="member-quick-icon" aria-hidden="true">🎟️</span>
          <div>
            <h3>¿Tienes Pack o Mensualidad?</h3>
            <p>Reserva tu bici sin pagar de nuevo — usa tu correo o teléfono.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="member-quick-form">
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setMsg(null); }}
            placeholder="Correo o teléfono de tu membresía"
            aria-label="Correo o teléfono de tu membresía"
            className="member-quick-input"
          />
          <button type="submit" className="btn btn-primary member-quick-btn" disabled={loading}>
            {loading ? 'Buscando…' : 'Reservar con mi membresía'}
          </button>
        </form>
        {msg && <p className="member-quick-msg" role="status">{msg}</p>}
      </div>

      {membership && (
        <MembershipBookingModal
          membership={membership}
          onClose={() => setMembership(null)}
          onBooked={() => { /* el modal muestra su propio éxito */ }}
        />
      )}
    </div>
  );
}
