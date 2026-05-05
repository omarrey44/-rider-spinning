import { useState } from 'react';
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

  const activePanel: 'lun' | 'sab' = activeDay === 'sab' ? 'sab' : 'lun';
  const baseSlots = activePanel === 'sab' ? saturdaySlots : weekdaySlots;

  const now = new Date();
  const currentHour24 = now.getHours() + now.getMinutes() / 60;
  const isToday = activeDay === todayKey;

  const visibleSlots = isToday
    ? baseSlots.filter((s) => slotTo24h(s) > currentHour24)
    : baseSlots;

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
          <h2>Esta semana en <span className="text-red">Rideon</span></h2>
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
            </button>
          ))}
        </div>

        <div className="schedule-grid day-panel active" role="tabpanel" tabIndex={0}>
          {visibleSlots.length === 0 && isToday ? (
            <div className="no-more-slots">
              <span className="no-more-icon">🌙</span>
              <h4>No hay más clases hoy</h4>
              <p>Selecciona otro día para ver horarios disponibles.</p>
            </div>
          ) : (
            visibleSlots.map((slot, idx) => (
              <article key={idx} className="slot" data-status={slot.status}>
                <div className="slot-time">
                  <span className="time-hour">{slot.hour}</span>
                  <span className="time-period">{slot.period}</span>
                </div>
                <span className="slot-divider" aria-hidden="true"></span>
                <div className="slot-info">
                  <h4>{slot.className}</h4>
                  <div className="slot-meta">
                    <span className="meta-item"><ClockIcon />{slot.duration}</span>
                    <span className="meta-sep" aria-hidden="true">|</span>
                    <span className="meta-item"><SignalIcon />{slot.level}</span>
                  </div>
                  <div className="slot-instructor">
                    <span className={`avatar-mini ${slot.instructorClass}`} aria-hidden="true">
                      {slot.instructorInitial}
                    </span>
                    <strong>{slot.instructorName}</strong>
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
            ))
          )}
        </div>

        <p className="schedule-note">
          Los horarios de lunes a viernes son los mismos. Los sábados tenemos clases especiales con Elmer.
        </p>
      </div>
    </section>
  );
}
