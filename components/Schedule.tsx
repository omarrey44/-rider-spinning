import { useState } from 'react';
import { DayKey, days, weekdaySlots, saturdaySlots, ScheduleSlot } from '@/data/schedule';
import { ArrowRight, ClockIcon, SignalIcon } from './Icons';

interface ScheduleProps {
  onSelectSlot: (slot: ScheduleSlot, day: DayKey) => void;
}

export default function Schedule({ onSelectSlot }: ScheduleProps) {
  const [activeDay, setActiveDay] = useState<DayKey>('lun');

  const activePanel: 'lun' | 'sab' = activeDay === 'sab' ? 'sab' : 'lun';
  const visibleSlots = activePanel === 'sab' ? saturdaySlots : weekdaySlots;

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
          {visibleSlots.map((slot, idx) => (
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
          ))}
        </div>

        <p className="schedule-note">
          Los horarios de lunes a viernes son los mismos. Los sábados tenemos clases especiales con Elmer.
        </p>
      </div>
    </section>
  );
}
