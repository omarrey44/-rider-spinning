'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRICE_DEFAULT: Record<'pack' | 'subscription', string> = { pack: '300', subscription: '650' };

export default function AdminMembershipModal({ open, onClose, onSuccess }: Props) {
  const [type, setType] = useState<'pack' | 'subscription'>('pack');
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', amount_paid: PRICE_DEFAULT.pack });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const changeType = (t: 'pack' | 'subscription') => {
    setType(t);
    setForm((f) => ({ ...f, amount_paid: PRICE_DEFAULT[t] }));
  };

  const handleClose = () => {
    setType('pack');
    setForm({ customer_name: '', customer_email: '', customer_phone: '', amount_paid: PRICE_DEFAULT.pack });
    setError('');
    setDone(null);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.customer_name.trim()) { setError('Nombre requerido'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email.trim())) { setError('Correo válido requerido'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          customer_phone: form.customer_phone.trim() || null,
          type,
          amount_paid: Math.round((parseFloat(form.amount_paid) || 0) * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');
      setDone(data.confirmation_number);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="admin-modal-overlay" onClick={handleClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="admin-modal-header">
          <div>
            <h2>Registrar Membresía / Pack</h2>
            <p className="admin-modal-subtitle">Pago en efectivo en el local</p>
          </div>
          <button className="admin-modal-close" onClick={handleClose} aria-label="Cerrar">×</button>
        </div>

        <div className="admin-modal-body">
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <h3 style={{ margin: '10px 0 4px' }}>Registrada</h3>
              <p style={{ color: '#666', margin: 0 }}>
                {type === 'pack' ? 'Pack 3 clases' : 'Mensualidad'} activo para <strong>{form.customer_email.trim().toLowerCase()}</strong>.
              </p>
              <p style={{ color: '#666', marginTop: 8 }}>
                Confirmación: <code style={{ fontWeight: 700, letterSpacing: 1 }}>{done}</code>
              </p>
              <p style={{ fontSize: 13, color: '#888', marginTop: 12 }}>
                El cliente reserva sus clases en <strong>Mis reservas</strong> con su correo o teléfono.
              </p>
            </div>
          ) : (
            <>
              <div className="admin-modal-section">
                <div className="admin-modal-section-header">
                  <span className="admin-modal-step">1</span>
                  <h3>Tipo</h3>
                </div>
                <div className="admin-modal-row">
                  <div className="admin-modal-field">
                    <label>Producto</label>
                    <select className="admin-modal-select" value={type} onChange={(e) => changeType(e.target.value as 'pack' | 'subscription')}>
                      <option value="pack">Pack 3 clases (vigencia 7 días)</option>
                      <option value="subscription">Mensualidad (30 días)</option>
                    </select>
                  </div>
                  <div className="admin-modal-field">
                    <label>Monto cobrado (MXN) *</label>
                    <input
                      type="number" min="0" step="50"
                      className="admin-modal-input"
                      value={form.amount_paid}
                      onChange={(e) => setForm((f) => ({ ...f, amount_paid: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-modal-section">
                <div className="admin-modal-section-header">
                  <span className="admin-modal-step">2</span>
                  <h3>Cliente</h3>
                </div>
                <div className="admin-modal-row">
                  <div className="admin-modal-field">
                    <label>Nombre completo *</label>
                    <input className="admin-modal-input" value={form.customer_name}
                      onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} placeholder="Nombre Apellido" />
                  </div>
                  <div className="admin-modal-field">
                    <label>Correo electrónico *</label>
                    <input type="email" className="admin-modal-input" value={form.customer_email}
                      onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))} placeholder="correo@ejemplo.com" />
                  </div>
                </div>
                <div className="admin-modal-row">
                  <div className="admin-modal-field">
                    <label>Teléfono (recomendado)</label>
                    <input type="tel" className="admin-modal-input" value={form.customer_phone}
                      onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))} placeholder="+52 614 000 0000" />
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
                  Con el correo o teléfono el cliente podrá reservar sus clases desde &quot;Mis reservas&quot;.
                </p>
              </div>

              {error && <p className="admin-modal-error">{error}</p>}
            </>
          )}
        </div>

        <div className="admin-modal-footer">
          {done ? (
            <button className="btn btn-primary" onClick={handleClose}>Listo</button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={handleClose} disabled={submitting}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !form.customer_name.trim() || !form.customer_email.trim()}>
                {submitting ? 'Registrando…' : 'Registrar pago en efectivo'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
