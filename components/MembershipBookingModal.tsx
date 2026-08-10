'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { weekdaySlots, saturdaySlots, ScheduleSlot, BIKE_CONFIG } from '@/data/schedule';
import { createClient } from '@/lib/supabase/client';

// Rangos [inicio,fin] por fila, derivados de BIKE_CONFIG.rowConfig (p. ej. [6,5]
// → fila 1 = bicis 1-6, fila 2 = 7-11). Mismo esquema que BikeSelector.
const MEM_ROW_RANGES = (() => {
  let cursor = 1;
  return BIKE_CONFIG.rowConfig.map((count) => {
    const start = cursor;
    const end = cursor + count - 1;
    cursor = end + 1;
    return { start, end };
  });
})();
const ROW_DESC = ['Principiantes · frente al instructor', 'Más espacio · atrás'];

// Grid simple y táctil de bicis para el modal (sin la escena 3D pesada).
function MemBikeGrid({
  classTitle, day, hour, onSelect,
}: {
  classTitle: string; day: string; hour: string;
  onSelect: (bikeNumber: number, bikeRow: number) => void;
}) {
  const [taken, setTaken] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(false);
      try {
        const p = new URLSearchParams({ class_title: classTitle, day, hour });
        const r = await fetch(`/api/bookings/available-bikes?${p}`);
        const d = await r.json();
        if (!cancelled) {
          if (!r.ok) setErr(true);
          else setTaken(Array.isArray(d.takenBikes) ? d.takenBikes : []);
        }
      } catch {
        if (!cancelled) setErr(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classTitle, day, hour]);

  const maintenance = BIKE_CONFIG.maintenance;
  const availableCount = BIKE_CONFIG.total - maintenance.length
    - taken.filter((n) => !maintenance.includes(n)).length;

  if (loading) return <p className="mem-grid-status">Cargando disponibilidad…</p>;
  if (err) return <p className="mem-grid-status mem-grid-status--err">No se pudo verificar disponibilidad. Cierra y vuelve a intentar.</p>;

  return (
    <div className="mem-grid">
      <div className="mem-grid-instructor" aria-hidden="true">🎧 INSTRUCTOR</div>
      {MEM_ROW_RANGES.map((range, i) => {
        const nums = Array.from({ length: range.end - range.start + 1 }, (_, k) => range.start + k);
        return (
          <div key={i} className="mem-grid-rowblock">
            <span className="mem-grid-rowlabel">Fila {i + 1} · <em>{ROW_DESC[i] ?? ''}</em></span>
            <div className="mem-grid-bikes">
              {nums.map((num) => {
                const isMaint = maintenance.includes(num);
                const isTaken = taken.includes(num);
                const isPopular = BIKE_CONFIG.popular.includes(num);
                const disabled = isMaint || isTaken;
                const cls = [
                  'mem-bike',
                  isMaint ? 'mem-bike--maint' : '',
                  isTaken ? 'mem-bike--taken' : '',
                  !disabled && isPopular ? 'mem-bike--popular' : '',
                  !disabled ? 'mem-bike--free' : '',
                ].filter(Boolean).join(' ');
                return (
                  <button
                    key={num}
                    type="button"
                    className={cls}
                    disabled={disabled}
                    onClick={() => onSelect(num, i + 1)}
                    title={isMaint ? 'En mantenimiento' : isTaken ? 'Ocupada' : `Bici #${String(num).padStart(2, '0')}`}
                    aria-label={isMaint ? `Bici ${num} en mantenimiento` : isTaken ? `Bici ${num} ocupada` : `Reservar bici ${num}`}
                  >
                    {disabled ? '🔒' : String(num).padStart(2, '0')}
                    {!disabled && isPopular && <span className="mem-bike-star">★</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="mem-grid-legend">
        <span><i className="mem-dot mem-dot--free" /> Disponible</span>
        <span><i className="mem-dot mem-dot--popular" /> Popular</span>
        <span><i className="mem-dot mem-dot--taken" /> Ocupada</span>
        <span><i className="mem-dot mem-dot--maint" /> Mantenimiento</span>
      </div>
      <p className={`mem-grid-count ${availableCount <= 3 ? 'low' : ''}`}>
        <strong>{availableCount}</strong> de {BIKE_CONFIG.total} disponibles
      </p>
    </div>
  );
}

// Mapea una fila de schedule_slots (Supabase) al ScheduleSlot de la UI.
function dbRowToScheduleSlot(row: {
  start_hour: number; start_minute: number; duration_min: number; class_title: string;
  class_color: string; level: string;
  instructor: { full_name: string; initial: string; avatar_class: string } | { full_name: string; initial: string; avatar_class: string }[] | null;
}): ScheduleSlot {
  const h = row.start_hour;
  const period: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const inst = Array.isArray(row.instructor) ? row.instructor[0] : row.instructor;
  return {
    hour: `${String(h12).padStart(2, '0')}:${String(row.start_minute).padStart(2, '0')}`,
    period,
    className: row.class_title,
    duration: `${row.duration_min} min`,
    level: row.level,
    classColor: row.class_color,
    instructorInitial: inst?.initial ?? '?',
    instructorName: inst?.full_name ?? 'Por confirmar',
    instructorClass: (inst?.avatar_class as ScheduleSlot['instructorClass']) ?? 'avatar-rosario',
    status: 'available',
    spotsText: '',
    price: '',
  };
}

export interface MembershipData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  type: 'pack' | 'subscription';
  credits_total: number | null;
  credits_used: number;
  expires_at: string;
  status: string;
  confirmation_number: string;
}

interface Props {
  membership: MembershipData;
  onClose: () => void;
  onBooked?: () => void;
}

type Step = 'date' | 'slot' | 'bike' | 'confirm' | 'done';

const DOW_TO_KEY: Record<number, string> = {
  1: 'lun', 2: 'mar', 3: 'mie', 4: 'jue', 5: 'vie', 6: 'sab',
};

const DAY_NAMES: Record<string, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles',
  jue: 'Jueves', vie: 'Viernes', sab: 'Sábado',
};

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatLong(d: Date) {
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getNext7Days(): Date[] {
  const result: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) result.push(d); // skip Sunday
  }
  return result;
}

export default function MembershipBookingModal({ membership, onClose, onBooked }: Props) {
  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [bikeNumber, setBikeNumber] = useState<number | null>(null);
  const [bikeRow, setBikeRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationNumber, setConfirmationNumber] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  // Bloquea el scroll de la página mientras el modal está abierto (foco total en el modal).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const dates = useMemo(() => getNext7Days(), []);

  // Horarios en vivo desde Supabase (instructores/clases reales), por día (1-6).
  const [slotsByDow, setSlotsByDow] = useState<Record<number, ScheduleSlot[]>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('schedule_slots')
          .select('day_of_week, start_hour, start_minute, duration_min, class_title, class_color, level, instructor:instructors!inner(full_name, initial, avatar_class)')
          .eq('active', true)
          .order('day_of_week', { ascending: true })
          .order('start_hour', { ascending: true });
        if (cancelled || !data) return;
        const grouped: Record<number, ScheduleSlot[]> = {};
        for (const row of data as unknown as Array<{ day_of_week: number } & Parameters<typeof dbRowToScheduleSlot>[0]>) {
          (grouped[row.day_of_week] ??= []).push(dbRowToScheduleSlot(row));
        }
        setSlotsByDow(grouped);
      } catch { /* fallback estático */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dow = selectedDate.getDay();
    const dbSlots = slotsByDow[dow];
    const allSlots = dbSlots && dbSlots.length
      ? dbSlots
      : (dow === 6 ? saturdaySlots : weekdaySlots);
    const isToday = toDateKey(selectedDate) === toDateKey(new Date());
    if (!isToday) return allSlots;
    const now = new Date();
    return allSlots.filter((slot) => {
      const [hourStr, minuteStr] = slot.hour.split(':');
      let h = parseInt(hourStr, 10);
      const m = parseInt(minuteStr || '0', 10);
      if (slot.period === 'PM' && h !== 12) h += 12;
      if (slot.period === 'AM' && h === 12) h = 0;
      const slotTime = new Date(selectedDate);
      slotTime.setHours(h, m, 0, 0);
      return slotTime > now;
    });
  }, [selectedDate, slotsByDow]);

  const bsSlot = useMemo(() => {
    if (!selectedDate || !selectedSlot) return null;
    const dayKey = DOW_TO_KEY[selectedDate.getDay()] || '';
    return {
      className: selectedSlot.className,
      instructorName: selectedSlot.instructorName,
      hour: selectedSlot.hour,
      period: selectedSlot.period,
      price: membership.type === 'pack' ? '1 crédito' : 'Incluido',
      duration: selectedSlot.duration,
      instructorClass: selectedSlot.instructorClass,
      dayName: DAY_NAMES[dayKey] || dayKey,
      date: selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }),
      fullDateTime: `${formatLong(selectedDate)} • ${selectedSlot.hour} ${selectedSlot.period}`,
    };
  }, [selectedDate, selectedSlot, membership.type]);

  const handleBikeSelected = useCallback((bNum: number, bRow: number) => {
    setBikeNumber(bNum);
    setBikeRow(bRow);
    setStep('confirm');
  }, []);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot || bikeNumber === null || bikeRow === null) return;
    setLoading(true);
    setError(null);

    const dayKey = DOW_TO_KEY[selectedDate.getDay()] || '';

    try {
      const res = await fetch('/api/memberships/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membership_id: membership.id,
          customer_name: membership.customer_name,
          customer_email: membership.customer_email,
          bike_number: bikeNumber,
          bike_row: bikeRow,
          class_title: selectedSlot.className,
          instructor_name: selectedSlot.instructorName,
          day: DAY_NAMES[dayKey] || dayKey,
          hour: `${selectedSlot.hour} ${selectedSlot.period}`,
          class_date: toDateKey(selectedDate),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al reservar');
        setLoading(false);
        if (res.status === 409) setStep('bike');
        return;
      }

      setConfirmationNumber(data.confirmation_number);
      setStep('done');
      onBooked?.();
    } catch {
      setError('Error inesperado. Intenta de nuevo.');
      setLoading(false);
    }
  };

  const creditsLeft =
    membership.type === 'pack' && membership.credits_total !== null
      ? membership.credits_total - membership.credits_used
      : null;

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && step !== 'done') onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Reservar clase con membresía"
    >
      <div className="modal membership-booking-modal">
        {step !== 'done' && (
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        )}

        {/* Step: date */}
        {step === 'date' && (
          <>
            <div className="modal-header">
              <span className="modal-eyebrow">
                {membership.type === 'pack'
                  ? `Pack 3 Clases · ${creditsLeft} crédito${creditsLeft === 1 ? '' : 's'} restante${creditsLeft === 1 ? '' : 's'}`
                  : 'Membresía Ilimitada · 1 clase por día'}
              </span>
              <h3>¿Qué día quieres ir?</h3>
            </div>
            <div className="mem-date-grid">
              {dates.map((d) => {
                const dow = d.getDay();
                const isToday = toDateKey(d) === toDateKey(new Date());
                return (
                  <button
                    key={toDateKey(d)}
                    className={`mem-date-btn${isToday ? ' mem-date-btn--today' : ''}`}
                    onClick={() => { setSelectedDate(d); setStep('slot'); }}
                  >
                    <span className="mem-date-weekday">
                      {d.toLocaleDateString('es-MX', { weekday: 'short' })}
                    </span>
                    <span className="mem-date-num">{d.getDate()}</span>
                    <span className="mem-date-month">
                      {d.toLocaleDateString('es-MX', { month: 'short' })}
                    </span>
                    {isToday && <span className="mem-date-today-tag">Hoy</span>}
                    {dow === 6 && <span className="mem-date-day-tag">Sábado</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step: slot */}
        {step === 'slot' && selectedDate && (
          <>
            <div className="modal-header">
              <span className="modal-eyebrow">{formatLong(selectedDate)}</span>
              <h3>Selecciona el horario</h3>
            </div>
            <button className="mem-back-btn" onClick={() => setStep('date')}>← Cambiar día</button>
            {slotsForDate.length === 0 && (
              <p className="mem-no-slots">No quedan horarios disponibles para hoy. Elige otro día.</p>
            )}
            <div className="mem-slot-list">
              {slotsForDate.map((slot) => (
                <button
                  key={`${slot.hour}-${slot.period}`}
                  className="mem-slot-btn"
                  onClick={() => { setSelectedSlot(slot); setStep('bike'); }}
                >
                  <div className="mem-slot-time">{slot.hour} <span className="mem-slot-period">{slot.period}</span></div>
                  <div className="mem-slot-info">
                    <strong>{slot.className}</strong>
                    <span>{slot.instructorName}</span>
                  </div>
                  <div className="mem-slot-dur">{slot.duration}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step: bike (reuse BikeSelector) */}
        {step === 'bike' && bsSlot && (
          <>
            <div className="modal-header mem-bike-header">
              <span className="modal-eyebrow">{bsSlot.className} · {bsSlot.fullDateTime}</span>
              <h3>Selecciona tu bici</h3>
              <p className="mem-bike-guidance">
                Toca una bicicleta disponible. Las ocupadas muestran un candado y tu selección se marcará en cyan.
              </p>
              <span className="mem-included-note">
                {membership.type === 'pack' ? 'Se usará 1 crédito de tu pack' : 'Incluido en tu mensualidad'} · no pagarás de nuevo
              </span>
            </div>
            <div className="mem-bike-body">
              <button className="mem-back-btn" onClick={() => setStep('slot')}>← Cambiar horario</button>
              {error && <div ref={errorRef} className="mem-bike-error" role="alert">{error}</div>}
              <MemBikeGrid
                classTitle={bsSlot.className}
                day={bsSlot.dayName}
                hour={`${bsSlot.hour} ${bsSlot.period}`}
                onSelect={handleBikeSelected}
              />
            </div>
          </>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && selectedDate && selectedSlot && bikeNumber !== null && (
          <>
            <div className="modal-header">
              <span className="modal-eyebrow">Confirmar reserva</span>
              <h3>¿Todo correcto?</h3>
            </div>
            <div className="mem-confirm-summary">
              <div className="mem-confirm-row">
                <span>Clase</span>
                <strong>{selectedSlot.className}</strong>
              </div>
              <div className="mem-confirm-row">
                <span>Instructor</span>
                <strong>{selectedSlot.instructorName}</strong>
              </div>
              <div className="mem-confirm-row">
                <span>Fecha</span>
                <strong>{formatLong(selectedDate)}</strong>
              </div>
              <div className="mem-confirm-row">
                <span>Hora</span>
                <strong>{selectedSlot.hour} {selectedSlot.period}</strong>
              </div>
              <div className="mem-confirm-row">
                <span>Bici</span>
                <strong>#{String(bikeNumber).padStart(2, '0')} · Fila {bikeRow}</strong>
              </div>
              <div className="mem-confirm-row">
                <span>Costo</span>
                <strong className="mem-confirm-free">
                  {membership.type === 'pack' ? `1 crédito del pack` : 'Incluido en membresía'}
                </strong>
              </div>
            </div>
            {error && <div ref={errorRef} className="form-error" role="alert">{error}</div>}
            <div className="mem-confirm-actions">
              <button className="btn btn-outline" onClick={() => setStep('bike')} disabled={loading}>
                Cambiar bici
              </button>
              <button
                className="btn btn-primary btn-shimmer"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading && <span className="loading-spinner" />}
                {loading ? 'Reservando…' : 'Confirmar reserva'}
              </button>
            </div>
          </>
        )}

        {/* Step: done */}
        {step === 'done' && confirmationNumber && (
          <div className="mem-success">
            <div className="mem-success-icon">✓</div>
            <h3>¡Reserva confirmada!</h3>
            <p className="mem-success-code">{confirmationNumber}</p>
            <p className="mem-success-sub">Tu clase quedó reservada. Llega 10 minutos antes.</p>
            {membership.type === 'pack' && creditsLeft !== null && (
              <p className="mem-success-credits">
                Te quedan <strong>{creditsLeft - 1}</strong> crédito{(creditsLeft - 1) !== 1 ? 's' : ''} en tu pack.
              </p>
            )}
            <button className="btn btn-primary btn-block" style={{ marginTop: 24 }} onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
