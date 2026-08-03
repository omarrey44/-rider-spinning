'use client';

import { useState, useEffect, useMemo } from 'react';
import { DayKey, days, weekdaySlots, saturdaySlots, aug8EventSlots, EVENT_DATE, EVENT_DAY_LABEL, resolveClassDateISO, ScheduleSlot, BIKE_CONFIG } from '@/data/schedule';
import { ArrowRight, ClockIcon, SignalIcon, MoonIcon, InfoIcon, CalendarDaysIcon } from './Icons';
import { createClient } from '@/lib/supabase/client';

// Las reservas en línea abren hasta que el estudio inicia operación regular.
// El 8 de agosto es la Gran Apertura (clase gratuita); operación regular inicia el 10.
// Comparación anclada a la fecha calendario de Chihuahua (no al huso horario del visitante).
const OPENING_DATE_STR = '2026-08-10';
function getTodayChihuahuaStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chihuahua',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const jsDayToKey: Record<number, DayKey> = {
  1: 'lun', 2: 'mar', 3: 'mie', 4: 'jue', 5: 'vie', 6: 'sab',
};

const dayKeyToDow: Record<DayKey, number> = {
  lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6,
};

const dayKeyToName: Record<DayKey, string> = {
  lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado',
};

// Domingo (0) → null (estudio cerrado). Lun-Sáb → DayKey.
function getCurrentDayKey(): DayKey | null {
  const d = new Date().getDay();
  return jsDayToKey[d] ?? null;
}

function slotTo24h(slot: ScheduleSlot): number {
  const [h, m] = slot.hour.split(':').map(Number);
  if (slot.period === 'PM' && h !== 12) return h + 12 + m / 60;
  if (slot.period === 'AM' && h === 12) return m / 60;
  return h + m / 60;
}

// Próxima ocurrencia (hoy incluido) del día de la semana como Date.
function nextDateForDayKey(dayKey: DayKey): Date {
  const target = dayKeyToDow[dayKey];
  const d = new Date();
  const diff = (target - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

// Offset lun..vie desde el lunes de apertura (sábado = evento gratis).
const OPENING_WEEK_OFFSET: Record<DayKey, number> = { lun: 0, mar: 1, mie: 2, jue: 3, vie: 4, sab: 5 };

// Fecha a mostrar para un día:
// - En prelaunch anclamos a la semana de apertura (lun 10 ago…) y el sábado al evento (8 ago).
// - En operación regular, la próxima ocurrencia del día.
function dateForDayKey(dayKey: DayKey, prelaunch: boolean): Date {
  if (prelaunch) {
    if (dayKey === 'sab') return new Date(`${EVENT_DATE}T12:00:00`);
    const base = new Date(`${OPENING_DATE_STR}T12:00:00`); // lunes 10 ago
    base.setDate(base.getDate() + OPENING_WEEK_OFFSET[dayKey]);
    return base;
  }
  return nextDateForDayKey(dayKey);
}
// "sábado 8 de agosto"
function fmtFull(d: Date): string {
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}
// "8 de agosto"
function fmtDayMonth(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
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
    price: `$${Math.round(row.price_cents / 100)} MXN`,
    capacity: row.capacity,
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
  // todayKey === null cuando es domingo (estudio cerrado)
  const [todayKey, setTodayKey] = useState<DayKey | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [clockTime, setClockTime] = useState('--:--');
  const [currentHour24, setCurrentHour24] = useState<number | null>(null);
  // false por defecto (determinista para SSR) — se corrige en el efecto de hidratación
  const [isPrelaunch, setIsPrelaunch] = useState(false);

  // slotsByDow: rows agrupadas por day_of_week (1-6). Vacío hasta que cargue Supabase.
  // Si la query falla o devuelve [], usamos los arrays estáticos como fallback.
  const [slotsByDow, setSlotsByDow] = useState<Record<number, ScheduleSlot[]>>({});
  const [usingDb, setUsingDb] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});

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
          setIsLoadingSlots(false);
          return;
        }

        const grouped: Record<number, ScheduleSlot[]> = {};
        for (const row of data as unknown as DbSlotRow[]) {
          const slot = dbRowToSlot(row);
          (grouped[row.day_of_week] ??= []).push(slot);
        }
        setSlotsByDow(grouped);
        setUsingDb(true);
        setIsLoadingSlots(false);
      } catch {
        // Env vars faltan o red caída → fallback silencioso
        if (!cancelled) {
          setUsingDb(false);
          setIsLoadingSlots(false);
        }
      }
    }

    fetchSlots();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetch('/api/bookings/slot-counts')
      .then((r) => r.json())
      .then((d) => { if (d.counts) setSlotCounts(d.counts); })
      .catch(() => {});
  }, []);

  // Hidratación de valores Date-dependientes (solo cliente, después del mount)
  useEffect(() => {
    const today = getCurrentDayKey();
    setTodayKey(today);
    const prelaunch = getTodayChihuahuaStr() < OPENING_DATE_STR;
    setIsPrelaunch(prelaunch);
    // Prelaunch: enfocar el sábado (Gran Apertura, único día reservable).
    // Operación regular: domingo → dejar 'lun'; otros → día actual.
    if (prelaunch) setActiveDay('sab');
    else if (today !== null) setActiveDay(today);

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
    // Prelaunch: el sábado es la Gran Apertura (clases gratis, 8 ago). Forzamos
    // los slots de evento (estáticos) para conservar isFree/eventDate, ignorando DB.
    if (activeDay === 'sab' && isPrelaunch) {
      return aug8EventSlots;
    }
    if (usingDb) {
      return slotsByDow[dayKeyToDow[activeDay]] ?? [];
    }
    return activeDay === 'sab' ? saturdaySlots : weekdaySlots;
  }, [usingDb, slotsByDow, activeDay, isPrelaunch]);

  // currentHour24 === null durante SSR + primer render del cliente.
  // En ese momento NO filtramos por hora actual (mostramos todos los slots)
  // y no marcamos "isToday". Una vez hidratado, useEffect lo setea.
  // En prelaunch NO filtramos por hora: los slots son fechas futuras (evento 8 ago
  // o semana de apertura), aunque hoy coincida con ese día de la semana.
  const isToday = currentHour24 !== null && activeDay === todayKey && !isPrelaunch;

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
    // Prelaunch: solo el evento gratis del sábado se reserva; los de pago quedan
    // bloqueados (los horarios entre semana aún pueden cambiar).
    if (isPrelaunch && !slot.isFree) return;
    // Ancla la fecha real de la clase (evento 8 ago / semana de apertura / próxima ocurrencia).
    const enriched = slot.isFree ? slot : { ...slot, eventDate: resolveClassDateISO(activeDay) };
    onSelectSlot(enriched, activeDay);
    const el = document.getElementById('reservar');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // Domingo: estudio cerrado. Solo mostrar banner cuando ya hidrató (currentHour24 !== null)
  // para evitar mismatch SSR.
  const isSunday = currentHour24 !== null && todayKey === null;

  return (
    <section className="schedule" id="horarios">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Horarios {isLoadingSlots && <span style={{ opacity: 0.6 }}>cargando...</span>}</span>
          <div className="section-head-row">
            <h2>Esta semana en <span className="text-red">Rideon</span></h2>
            <span className="live-clock">
              <ClockIcon />{clockTime}
            </span>
          </div>
          <p>Selecciona un día y reserva tu lugar antes de que se llene.</p>
        </div>

        {isPrelaunch ? (
          <div className="sunday-banner prelaunch-banner" role="status">
            <CalendarDaysIcon size={20} />
            <div className="sunday-banner-text">
              <strong>¡Reserva gratis tu lugar del sábado 8 de agosto!</strong>
              <span>Elige un horario del <em>sábado</em> — clases gratuitas por la Gran Apertura. Las reservas con costo abren el 10 de agosto.</span>
            </div>
          </div>
        ) : isSunday && (
          <div className="sunday-banner" role="status">
            <MoonIcon />
            <div className="sunday-banner-text">
              <strong>Hoy domingo cerramos</strong>
              <span>Próxima clase: <em>lunes 06:00 AM con Rosario</em></span>
            </div>
          </div>
        )}

        <div className="day-tabs" role="tablist" aria-label="Selecciona un día">
          {days.map((d) => {
            // Prelaunch: solo el sábado (Gran Apertura gratis) es seleccionable.
            const tabLocked = isPrelaunch && d.key !== 'sab';
            return (
              <button
                key={d.key}
                className={`day-tab ${activeDay === d.key ? 'active' : ''} ${tabLocked ? 'day-tab-locked' : ''}`}
                role="tab"
                aria-selected={activeDay === d.key}
                disabled={tabLocked}
                title={tabLocked ? 'Disponible a partir del 10 de agosto' : undefined}
                onClick={() => !tabLocked && setActiveDay(d.key)}
              >
                {d.label}
                {d.key === (isPrelaunch ? 'sab' : todayKey) && <span className="today-dot" aria-label={isPrelaunch ? 'Próxima: Gran Apertura' : 'Hoy'} />}
              </button>
            );
          })}
          <span className="day-tab-indicator" />
        </div>

        {currentHour24 !== null && (
          <p className="week-hint">
            {isPrelaunch ? (
              <>🎉 <strong>{fmtFull(new Date(`${EVENT_DATE}T12:00:00`))}</strong>: clase gratis de Gran Apertura · reservas regulares del <strong>{fmtDayMonth(dateForDayKey('lun', true))}</strong> al <strong>{fmtDayMonth(dateForDayKey('vie', true))}</strong></>
            ) : (
              <>Reservando la semana del <strong>{fmtDayMonth(nextDateForDayKey('lun'))}</strong> al <strong>{fmtDayMonth(nextDateForDayKey('sab'))}</strong></>
            )}
          </p>
        )}

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
                const cap = slot.capacity ?? BIKE_CONFIG.total;
                const countDay = slot.isFree ? EVENT_DAY_LABEL : dayKeyToName[activeDay];
                const countKey = `${slot.className}|${countDay}|${slot.hour} ${slot.period}`;
                const taken = slotCounts[countKey] ?? 0;
                const available = Math.max(0, cap - taken);
                const liveStatus: 'available' | 'few' | 'full' = available === 0 ? 'full' : available <= 3 ? 'few' : 'available';
                const liveSpotsText = available === 0 ? 'Llena' : `${available} disponibles`;
                // Prelaunch: bloqueado si NO es la clase gratuita del evento.
                const locked = isPrelaunch && !slot.isFree;
                // Fecha de la card: evento usa su fecha fija; el resto la próxima ocurrencia del día.
                const slotDate = slot.eventDate
                  ? fmtFull(new Date(slot.eventDate + 'T12:00:00'))
                  : (currentHour24 !== null ? fmtFull(dateForDayKey(activeDay, isPrelaunch)) : '');
                return (
                  <article
                    key={`${activeDay}-${idx}`}
                    className={`slot ${isNext ? 'slot-next' : ''}`}
                    data-status={slot.status}
                    data-class-color={slot.classColor}
                    style={{
                      '--stagger-delay': `${idx * 80}ms`,
                      '--slot-img': `url(/class-${slot.classColor}.webp)`,
                    } as React.CSSProperties}
                    onDoubleClick={() => !locked && handleReserve(slot)}
                  >
                    {isNext && (
                      <span className="next-badge">
                        Próxima <span className="next-badge-dot" />
                      </span>
                    )}
                    <div className="slot-photo" aria-hidden="true">
                      <div className="slot-time">
                        <span className="time-hour">{slot.hour}</span>
                        <span className="time-period">{slot.period}</span>
                      </div>
                    </div>
                    <div className="slot-info">
                      <h4>{slot.className}</h4>
                      {slotDate && (
                        <span className="slot-date">
                          <CalendarDaysIcon size={13} /> {slotDate}
                        </span>
                      )}
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
                      <div className="slot-status-group">
                        <span className={`slot-status status-${liveStatus}`}>
                          <span className="status-dot"></span>{liveSpotsText}
                        </span>
                        {liveStatus === 'few' && (
                          <span className="urgency-badge">⚡ Pocos lugares</span>
                        )}
                      </div>
                      <span className="slot-price">{slot.price}</span>
                      <button
                        className="slot-cta"
                        onClick={() => handleReserve(slot)}
                        disabled={locked}
                        title={locked ? 'Reservas disponibles a partir del 10 de agosto' : undefined}
                      >
                        {locked
                          ? 'Disponible el 10 ago'
                          : slot.isFree
                            ? <>Reservar gratis <ArrowRight /></>
                            : <>Seleccionar bici <ArrowRight /></>}
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
          <span>{isPrelaunch
            ? 'Gran Apertura: sábado 8 de agosto, clases gratuitas de 8:00 AM a 1:00 PM. ¡Reserva tu bici sin costo!'
            : 'Los horarios de lunes a viernes son los mismos. Los sábados tenemos clases especiales con Elmer.'}</span>
        </div>
      </div>
    </section>
  );
}
