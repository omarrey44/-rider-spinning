'use client';

import { useState, useEffect, useMemo } from 'react';
import { DayKey, days, weekdaySlots, saturdaySlots, ScheduleSlot } from '@/data/schedule';
import { ArrowRight, ClockIcon, SignalIcon, MoonIcon, InfoIcon } from './Icons';
import { createClient } from '@/lib/supabase/client';

const jsDayToKey: Record<number, DayKey> = {
  1: 'lun', 2: 'mar', 3: 'mie', 4: 'jue', 5: 'vie', 6: 'sab',
};

const dayKeyToDow: Record<DayKey, number> = {
  lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6,
};

function getCurrentDayKey(): DayKey {
  const d = new Date().getDay();
  const key = jsDayToKey[d];
  return key ?? 'lun';
}

function slotTo24h(slot: ScheduleSlot): number {
  const [h, m] = slot.hour.split(':').map(Number);
  if (slot.period === 'PM' && h !== 12) return h + 12 + m / 60;
  if (slot.period === 'AM' && h === 12) return m / 60;
  return h + m / 60;
}

// Mapea una fila de schedule_slots (con join a instructors) al tipo ScheduleSlot que usa la UI
type DbSlotRow = {
  start_hour: number;
  start_minute: number;
  duration_min: number;
  class_title: string;
  class_color: string;
  level: string;
  price_cents: number;
  capacity: number;
  day_of_week: number;
  instructor: {
    full_name: string;
    initial: string;
    avatar_class: 'avatar-rosario' | 'avatar-lucia' | 'avatar-elmer';
  } | null;
};

function dbRowToSlot(row: DbSlotRow): ScheduleSlot {
  const h = row.start_hour;
  const m = row.start_minute;
  const period: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const hour = `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return {
    hour,
    period,
    className: row.class_title,
    duration: `${row.duration_min} min`,
    level: row.level,
    classColor: row.class_color,
    instructorInitial: row.instructor?.initial ?? '?',
    instructorName: row.instructor?.full_name ?? 'Por confirmar',
    instructorClass: row.instructor?.avatar_class ?? 'avatar-rosario',
    status: 'available',
    spotsText: `${row.capacity} disponibles`,
    price: `$${Math.round(row.price_cents / 100)}`,
  };
}

interface ScheduleProps {
  onSelectSlot: (slot: ScheduleSlot, day: DayKey) => void;
}

export default function Schedule({ onSelectSlot }: ScheduleProps) {
  // ⚠ Valores DEPENDIENTES DE Date() inicializan con defaults DETERMINISTAS
  // para que el HTML del server y del cliente coincidan en la primera
  // hidratación. Después de hidratar, useEffect los actualiza con valores
  // reales. Esto previene hydration errors (#418, #423, #425).
  const [activeDay, setActiveDay] = useState<DayKey>('lun');
  const [todayKey, setTodayKey] = useState<DayKey>('lun');
  const [animKey, setAnimKey] = useState(0);
  const [clockTime, setClockTime] = useState('--:--');
  const [currentHour24, setCurrentHour24] = useState<number | null>(null);

  // slotsByDow: rows agrupadas por day_of_week (1-6). Vacío hasta que cargue Supabase.
  // Si la query falla o devuelve [], usamos los arrays estáticos como fallback.
  const [slotsByDow, setSlotsByDow] = useState<Record<number, ScheduleSlot[]>>({});
  const [usingDb, setUsingDb] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSlots() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('schedule_slots')
          .select(`
            day_of_week,
            start_hour,
            start_minute,
            duration_min,
            class_title,
            class_color,
            level,
            price_cents,
            capacity,
            instructor:instructors!inner ( full_name, initial, avatar_class )
          `)
          .eq('active', true)
          .order('day_of_week', { ascending: true })
          .order('start_hour', { ascending: true });

        if (cancelled) return;

        if (error || !data || data.length === 0) {
          // Sin DB / sin filas / error: nos quedamos con el fallback estático
          setUsingDb(false);
          return;
        }

        const grouped: Record<number, ScheduleSlot[]> = {};
        for (const row of data as unknown as DbSlotRow[]) {
          const slot = dbRowToSlot(row);
          (grouped[row.day_of_week] ??= []).push(slot);
        }
        setSlotsByDow(grouped);
        setUsingDb(true);
      } catch {
        // Env vars faltan o red caída → fallback silencioso
        if (!cancelled) setUsingDb(false);
      }
    }

    fetchSlots();
    return () => { cancelled = true; };
  }, []);

  // Hidratación de valores Date-dependientes (solo cliente, después del mount)
  useEffect(() => {
    const today = getCurrentDayKey();
    setTodayKey(today);
    setActiveDay(today);

    const updateNow = () => {
      const n = new Date();
      setClockTime(`${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`);
      setCurrentHour24(n.getHours() + n.getMinutes() / 60);
    };
    updateNow();
    const t = setInterval(updateNow, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [activeDay]);

  // Resolver baseSlots: si tenemos DB usamos eso (filtrado por día), si no fallback estático
  const baseSlots: ScheduleSlot[] = useMemo(() => {
    if (usingDb) {
      return slotsByDow[dayKeyToDow[activeDay]] ?? [];
    }
    return activeDay === 'sab' ? saturdaySlots : weekdaySlots;
  }, [usingDb, slotsByDow, activeDay]);

  // currentHour24 === null durante SSR + primer render del cliente.
  // En ese momento NO filtramos por hora actual (mostramos todos los slots)
  // y no marcamos "isToday". Una vez hidratado, useEffect lo setea.
  const isToday = currentHour24 !== null && activeDay === todayKey;

  const visibleSlots = isToday && currentHour24 !== null
    ? baseSlots.filter((s) => slotTo24h(s) > currentHour24)
    : baseSlots;

  const nextSlot = useMemo(() => {
    if (!isToday || currentHour24 === null) return null;
    const upcoming = baseSlots
      .filter((s) => slotTo24h(s) > currentHour24)
      .sort((a, b) => slotTo24h(a) - slotTo24h(b));
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [isToday, baseSlots, currentHour24]);

  const handleReserve = (slot: ScheduleSlot) => {
    onSelectSlot(slot, activeDay);
    const el = document.getElementById('reservar');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="schedule" id="horarios">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Horarios</span>
          <div className="section-head-row">
            <h2>Esta semana en <span className="text-red">Rideon</span></h2>
            <span className="live-clock">
              <ClockIcon />{clockTime}
            </span>
          </div>
          <p>Selecciona un día y reserva tu lugar antes de que se llene.</p>
        </div>

        <div className="day-tabs" role="tablist" aria-label="Selecciona un día">
          {days.map((d) => (
            <button
              key={d.key}
              className={`day-tab ${activeDay === d.key ? 'active' : ''}`}
              role="tab"
              aria-selected={activeDay === d.key}
              onClick={() => setActiveDay(d.key)}
            >
              {d.label}
              {d.key === todayKey && <span className="today-dot" aria-label="Hoy" />}
            </button>
          ))}
          <span className="day-tab-indicator" />
        </div>

        <div
          className="schedule-grid day-panel active"
          role="tabpanel"
          tabIndex={0}
          key={animKey}
        >
          {visibleSlots.length === 0 && isToday ? (
            <div className="no-more-slots">
              <span className="no-more-icon"><MoonIcon /></span>
              <h4>No hay más clases hoy</h4>
              <p>Selecciona otro día para ver horarios disponibles.</p>
            </div>
          ) : (
            <>
              {visibleSlots.map((slot, idx) => {
                const isNext = isToday && nextSlot !== null && slot === nextSlot;
                return (
                  <article
                    key={`${activeDay}-${idx}`}
                    className={`slot ${isNext ? 'slot-next' : ''}`}
                    data-status={slot.status}
                    data-class-color={slot.classColor}
                    style={{ '--stagger-delay': `${idx * 80}ms` } as React.CSSProperties}
                  >
                    {isNext && (
                      <span className="next-badge">
                        Próxima <span className="next-badge-dot" />
                      </span>
                    )}
                    <div className="slot-time">
                      <span className="time-hour">{slot.hour}</span>
                      <span className="time-period">{slot.period}</span>
                    </div>
                    <span className="slot-divider" aria-hidden="true"></span>
                    <div className="slot-info">
                      <h4>{slot.className}</h4>
                      <span className={`class-type-tag class-type-tag--${slot.classColor}`}>
                        {slot.className.split(' ')[0]}
                      </span>
                      <div className="slot-meta">
                        <span className="meta-item"><ClockIcon />{slot.duration}</span>
                        <span className="meta-sep" aria-hidden="true">|</span>
                        <span className="meta-item"><SignalIcon />{slot.level}</span>
                      </div>
                      <div className="slot-instructor">
                        <span className={`avatar-mini ${slot.instructorClass}`} aria-hidden="true">
                          {slot.instructorInitial}
                        </span>
                        <span className="instructor-name">{slot.instructorName}</span>
                      </div>
                    </div>
                    <div className="slot-side">
                      <span className={`slot-status status-${slot.status}`}>
                        <span className="status-dot"></span>{slot.spotsText}
                      </span>
                      <span className="slot-price">{slot.price}</span>
                      <button
                        className="slot-cta"
                        onClick={() => handleReserve(slot)}
                      >
                        Reservar <ArrowRight />
                      </button>
                    </div>
                  </article>
                );
              })}
            </>
          )}
        </div>

        <div className="schedule-note">
          <span className="note-icon"><InfoIcon /></span>
          <span>Los horarios de lunes a viernes son los mismos. Los sábados tenemos clases especiales con Elmer.</span>
        </div>
      </div>
    </section>
  );
}
