'use client';

import { useState, useEffect } from 'react';
import { weekdaySlots, saturdaySlots, BIKE_CONFIG } from '@/data/schedule';

const DAY_OPTIONS = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sábado' },
];

const DAY_KEY_TO_NAME: Record<string, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminManualBookingModal({ open, onClose, onSuccess }: Props) {
  const [dayKey, setDayKey] = useState('');
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [selectedBike, setSelectedBike] = useState<number | null>(null);
  const [takenBikes, setTakenBikes] = useState<number[]>([]);
  const [loadingBikes, setLoadingBikes] = useState(false);

  const [paymentType, setPaymentType] = useState<'cash' | 'membership' | 'pack'>('cash');
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    amount_paid: '200',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const slots = dayKey === 'sab' ? saturdaySlots : dayKey ? weekdaySlots : [];
  const selectedSlot = selectedSlotIdx !== null ? slots[selectedSlotIdx] : null;

  useEffect(() => {
    setSelectedSlotIdx(null);
    setSelectedBike(null);
    setTakenBikes([]);
  }, [dayKey]);

  useEffect(() => {
    setSelectedBike(null);
    setTakenBikes([]);
    if (!selectedSlot || !dayKey) return;
    const dayName = DAY_KEY_TO_NAME[dayKey];
    const hour = `${selectedSlot.hour} ${selectedSlot.period}`;
    setLoadingBikes(true);
    fetch(
      `/api/bookings/available-bikes?class_title=${encodeURIComponent(selectedSlot.className)}&day=${encodeURIComponent(dayName)}&hour=${encodeURIComponent(hour)}`
    )
      .then((r) => r.json())
      .then((d) => setTakenBikes(d.takenBikes || []))
      .catch(() => {})
      .finally(() => setLoadingBikes(false));
  }, [selectedSlot, dayKey]);

  const handleClose = () => {
    setDayKey('');
    setSelectedSlotIdx(null);
    setSelectedBike(null);
    setTakenBikes([]);
    setPaymentType('cash');
    setForm({ customer_name: '', customer_email: '', customer_phone: '', amount_paid: '200' });
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedSlot || !dayKey || selectedBike === null) {
      setError('Selecciona día, clase y bici');
      return;
    }
    if (!form.customer_name.trim()) { setError('Nombre requerido'); return; }
    if (!form.customer_email.trim()) { setError('Correo requerido'); return; }

    const { rowConfig } = BIKE_CONFIG;
    let bikeRow = 1;
    let count = 0;
    for (let r = 0; r < rowConfig.length; r++) {
      count += rowConfig[r];
      if (selectedBike <= count) { bikeRow = r + 1; break; }
    }

    const amountMXN = paymentType === 'cash' ? (parseFloat(form.amount_paid) || 0) : 0;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          customer_phone: form.customer_phone.trim() || null,
          bike_number: selectedBike,
          bike_row: bikeRow,
          class_title: selectedSlot.className,
          instructor_name: selectedSlot.instructorName,
          day: DAY_KEY_TO_NAME[dayKey],
          hour: `${selectedSlot.hour} ${selectedSlot.period}`,
          amount_paid: Math.round(amountMXN * 100),
          payment_type: paymentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la reserva');
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const { rowConfig } = BIKE_CONFIG;
  let bikeCounter = 0;
  const bikeRows = rowConfig.map((count) => {
    const row: number[] = [];
    for (let i = 0; i < count; i++) {
      bikeCounter++;
      row.push(bikeCounter);
    }
    return row;
  });

  const canSubmit = selectedBike !== null && form.customer_name.trim() && form.customer_email.trim() && !submitting;

  return (
    <div className="admin-modal-overlay" onClick={handleClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>Nueva Reserva en Efectivo</h2>
            <p className="admin-modal-subtitle">Reserva manual para pago en local</p>
          </div>
          <button className="admin-modal-close" onClick={handleClose} aria-label="Cerrar">×</button>
        </div>

        <div className="admin-modal-body">
          {/* ── Sección 1: Clase ── */}
          <div className="admin-modal-section">
            <div className="admin-modal-section-header">
              <span className="admin-modal-step">1</span>
              <h3>Clase</h3>
            </div>
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>Día</label>
                <select
                  value={dayKey}
                  onChange={(e) => setDayKey(e.target.value)}
                  className="admin-modal-select"
                >
                  <option value="">Selecciona día…</option>
                  {DAY_OPTIONS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-modal-field">
                <label>Clase / Horario</label>
                <select
                  value={selectedSlotIdx ?? ''}
                  onChange={(e) =>
                    setSelectedSlotIdx(e.target.value === '' ? null : Number(e.target.value))
                  }
                  disabled={!dayKey}
                  className="admin-modal-select"
                >
                  <option value="">Selecciona clase…</option>
                  {slots.map((s, i) => (
                    <option key={i} value={i}>
                      {s.hour} {s.period} · {s.className} · {s.instructorName.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Sección 2: Bici ── */}
          {selectedSlot && (
            <div className="admin-modal-section">
              <div className="admin-modal-section-header">
                <span className="admin-modal-step">2</span>
                <h3>
                  Bici
                  {loadingBikes && <span className="admin-modal-loading-tag">cargando…</span>}
                </h3>
              </div>

              <div className="admin-bike-grid-wrap">
                <div className="admin-bike-stage-label">↑ Escenario / Instructor</div>
                {bikeRows.map((row, ri) => (
                  <div key={ri} className="admin-bike-row">
                    <span className="admin-bike-row-label">F{ri + 1}</span>
                    <div className="admin-bike-row-bikes">
                      {row.map((bikeNum) => {
                        const taken = takenBikes.includes(bikeNum);
                        const selected = selectedBike === bikeNum;
                        return (
                          <button
                            key={bikeNum}
                            onClick={() => !taken && setSelectedBike(bikeNum)}
                            disabled={taken}
                            className={[
                              'admin-bike-btn',
                              taken ? 'taken' : 'free',
                              selected ? 'selected' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            title={taken ? 'Ocupada' : `Bici #${String(bikeNum).padStart(2, '0')}`}
                          >
                            {String(bikeNum).padStart(2, '0')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="admin-bike-legend">
                  <span><span className="admin-bike-dot free" />Libre</span>
                  <span><span className="admin-bike-dot taken" />Ocupada</span>
                  <span><span className="admin-bike-dot selected" />Seleccionada</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Sección 3: Cliente ── */}
          <div className="admin-modal-section">
            <div className="admin-modal-section-header">
              <span className="admin-modal-step">3</span>
              <h3>Cliente</h3>
            </div>
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Nombre Apellido"
                  className="admin-modal-input"
                />
              </div>
              <div className="admin-modal-field">
                <label>Correo electrónico *</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="admin-modal-input"
                />
              </div>
            </div>
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  placeholder="+52 614 000 0000"
                  className="admin-modal-input"
                />
              </div>
              <div className="admin-modal-field">
                <label>Tipo de pago *</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as 'cash' | 'membership' | 'pack')}
                  className="admin-modal-select"
                >
                  <option value="cash">Efectivo</option>
                  <option value="membership">Membresía</option>
                  <option value="pack">Pack 3 Horas</option>
                </select>
              </div>
            </div>
            {paymentType === 'cash' && (
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>Monto cobrado (MXN) *</label>
                  <input
                    type="number"
                    value={form.amount_paid}
                    onChange={(e) => setForm((f) => ({ ...f, amount_paid: e.target.value }))}
                    min="0"
                    step="50"
                    className="admin-modal-input"
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="admin-modal-error">{error}</p>}
        </div>

        <div className="admin-modal-footer">
          <button className="btn btn-outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? 'Guardando…' : 'Confirmar Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}
