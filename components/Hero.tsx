'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from './Icons';
import { weekdaySlots, saturdaySlots, ScheduleSlot } from '@/data/schedule';

function slotTo24h(s: ScheduleSlot): number {
  const [h, m] = s.hour.split(':').map(Number);
  if (s.period === 'PM' && h !== 12) return h + 12 + m / 60;
  if (s.period === 'AM' && h === 12) return m / 60;
  return h + m / 60;
}

/* Próxima clase relativa a "ahora": hoy si quedan, sino primera de mañana */
function getNextClass(): { slot: ScheduleSlot; whenLabel: string } | null {
  const now = new Date();
  const dow = now.getDay();
  const isSaturday = dow === 6;
  const isSunday = dow === 0;

  const todaySlots = isSaturday ? saturdaySlots : isSunday ? [] : weekdaySlots;
  const currentH = now.getHours() + now.getMinutes() / 60;
  const remainingToday = todaySlots
    .filter((s) => slotTo24h(s) > currentH)
    .sort((a, b) => slotTo24h(a) - slotTo24h(b));

  if (remainingToday.length > 0) {
    return { slot: remainingToday[0], whenLabel: 'Hoy' };
  }

  // Sin clases hoy: tomar la primera del próximo día con slots
  const nextDow = (dow + 1) % 7;
  const nextSlots = nextDow === 6 ? saturdaySlots : nextDow === 0 ? [] : weekdaySlots;
  if (nextSlots.length > 0) {
    return { slot: nextSlots[0], whenLabel: 'Mañana' };
  }
  return null;
}

export default function Hero() {
  const [nextClass, setNextClass] = useState<ReturnType<typeof getNextClass>>(null);

  useEffect(() => {
    setNextClass(getNextClass());
    // Re-evaluar cada minuto para que cambie cuando pase la siguiente clase
    const t = setInterval(() => setNextClass(getNextClass()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="hero">
      <div className="hero-bg">
        <div className="hero-overlay"></div>
        <svg className="rabbit-trail" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-50 150 Q 300 80 600 130 T 1500 60" stroke="var(--teal-primary)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="8 12" />
        </svg>
      </div>

      <div className="container hero-content">
        <div className="hero-text">
          <span className="hero-eyebrow hero-anim-in">// SPINNING STUDIO · CHIHUAHUA</span>
          <h1 className="hero-title">
            <span className="title-line"><span className="hero-anim-in delay-1">Pedalea</span> <span className="text-red hero-anim-in delay-2">Rápido</span></span>
            <span className="title-line"><span className="hero-anim-in delay-3">Llega</span> <span className="text-red hero-anim-in delay-4">Lejos</span></span>
          </h1>
          <p className="hero-sub hero-anim-in delay-4">
            Spinning de alta intensidad. Reserva tu bici, elige tu lugar y prepárate para sudar.
          </p>

          <div className="hero-ctas hero-anim-in delay-5">
            <a href="#horarios" className="btn btn-primary btn-lg btn-shimmer">Reservar Clase <ArrowRight /></a>
          </div>

          <div className="hero-proof hero-anim-in delay-6">
            <div className="hero-bike-visual">
              <img className="hero-bike-img" src="/bike-masked.png" alt="" aria-hidden="true" />
              <div className="speed-lines" aria-hidden="true">
                <span className="speed-line sl-1"></span>
                <span className="speed-line sl-2"></span>
                <span className="speed-line sl-3"></span>
                <span className="speed-line sl-4"></span>
                <span className="speed-line sl-5"></span>
              </div>
            </div>
            <div className="proof-text">
              <span className="km-eyebrow">Próximamente en Chihuahua</span>
              <span className="km-headline">Sé parte del <strong>primer ride</strong></span>
              <span className="km-label">Reserva tu lugar antes de que abran las puertas</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-bg"></div>
            <div className="hero-card-content">
              {nextClass ? (
                <>
                  <span className="badge badge-live">● PRÓXIMA CLASE · {nextClass.whenLabel}</span>
                  <h3>{nextClass.slot.className}</h3>
                  <p>Con {nextClass.slot.instructorName} · {nextClass.slot.duration} · {nextClass.slot.hour} {nextClass.slot.period}</p>
                </>
              ) : (
                <>
                  <span className="badge badge-live">● ESTA SEMANA</span>
                  <h3>Reserva tu primer ride</h3>
                  <p>Lun a Sáb · 6 instructores · 32 clases por semana</p>
                </>
              )}
              {/* Mini grid 4×3: matchea salón real (12 bikes) */}
              <div className="bike-preview">
                <div className="bike-row">
                  <span className="bike free"></span><span className="bike taken"></span>
                  <span className="bike free"></span><span className="bike free"></span>
                </div>
                <div className="bike-row">
                  <span className="bike free"></span><span className="bike selected"></span>
                  <span className="bike free"></span><span className="bike taken"></span>
                </div>
                <div className="bike-row">
                  <span className="bike taken"></span><span className="bike free"></span>
                  <span className="bike free"></span><span className="bike free"></span>
                </div>
              </div>
              <div className="hero-card-footer">
                <span>Bike #06 · Fila 2 centro</span>
                <strong>{nextClass ? nextClass.slot.price : '$220'} MXN</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-slash" aria-hidden="true">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <polygon points="0,100 1440,0 1440,100" fill="#FFFFFF" />
          <polygon points="0,100 1440,30 1440,40 0,100" fill="var(--teal-primary)" opacity="0.9" />
        </svg>
      </div>
    </header>
  );
}
