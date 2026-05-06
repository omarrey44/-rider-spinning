import { useState, useEffect, useMemo } from 'react';
import { DayKey, days, weekdaySlots, saturdaySlots, ScheduleSlot } from '@/data/schedule';
import { ArrowRight, ClockIcon, SignalIcon } from './Icons';

const jsDayToKey: Record<number, DayKey> = {
  1: 'lun', 2: 'mar', 3: 'mie', 4: 'jue', 5: 'vie', 6: 'sab',
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

interface ScheduleProps {
  onSelectSlot: (slot: ScheduleSlot, day: DayKey) => void;
}

export default function Schedule({ onSelectSlot }: ScheduleProps) {
  const todayKey = getCurrentDayKey();
  const [activeDay, setActiveDay] = useState<DayKey>(todayKey);
  const [animKey, setAnimKey] = useState(0);
  const [clockTime, setClockTime] = useState(() => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setClockTime(`${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`);
    }, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [activeDay]);

  const activePanel: 'lun' | 'sab' = activeDay === 'sab' ? 'sab' : 'lun';
  const baseSlots = activePanel === 'sab' ? saturdaySlots : weekdaySlots;

  const now = new Date();
  const currentHour24 = now.getHours() + now.getMinutes() / 60;
  const isToday = activeDay === todayKey;

  const visibleSlots = isToday
    ? baseSlots.filter((s) => slotTo24h(s) > currentHour24)
    : baseSlots;

  const nextSlot = useMemo(() => {
    if (!isToday) return null;
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
              <span className="no-more-icon">🌙</span>
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
          <span className="note-icon">ℹ️</span>
          <span>Los horarios de lunes a viernes son los mismos. Los sábados tenemos clases especiales con Elmer.</span>
        </div>
      </div>
    </section>
  );
}
