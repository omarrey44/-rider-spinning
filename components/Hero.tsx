'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  ClockIcon,
  UserIcon,
  EyeIcon,
  FanIcon,
  VolumeIcon,
  GroupIcon,
  PowerIcon,
} from './Icons';
import { weekdaySlots, saturdaySlots, ScheduleSlot, BIKE_CONFIG } from '@/data/schedule';

function slotTo24h(s: ScheduleSlot): number {
  const [h, m] = s.hour.split(':').map(Number);
  if (s.period === 'PM' && h !== 12) return h + 12 + m / 60;
  if (s.period === 'AM' && h === 12) return m / 60;
  return h + m / 60;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

function getNextClass(): { slot: ScheduleSlot; whenLabel: string; dayName: string } | null {
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
    return { slot: remainingToday[0], whenLabel: 'Hoy', dayName: DAY_NAMES[dow] };
  }

  const nextDow = (dow + 1) % 7;
  const nextSlots = nextDow === 6 ? saturdaySlots : nextDow === 0 ? [] : weekdaySlots;
  if (nextSlots.length > 0) {
    return { slot: nextSlots[0], whenLabel: 'Mañana', dayName: DAY_NAMES[nextDow] };
  }
  return null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// Featured bike (popular center, fila 2). Highlighted only when not taken.
const FEATURED_BIKE = BIKE_CONFIG.popular[0] ?? 6;

export default function Hero() {
  const [nextClass, setNextClass] = useState<ReturnType<typeof getNextClass>>(null);
  const [takenBikes, setTakenBikes] = useState<number[]>([]);
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 400], [0, 80]);

  useEffect(() => {
    setNextClass(getNextClass());
    const t = setInterval(() => setNextClass(getNextClass()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!nextClass) {
      setTakenBikes([]);
      return;
    }
    let cancelled = false;
    const fetchTaken = async () => {
      try {
        const params = new URLSearchParams({
          class_title: nextClass.slot.className,
          day: nextClass.dayName,
          hour: `${nextClass.slot.hour} ${nextClass.slot.period}`,
        });
        const res = await fetch(`/api/bookings/available-bikes?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setTakenBikes(Array.isArray(data.takenBikes) ? data.takenBikes : []);
      } catch {
        if (!cancelled) setTakenBikes([]);
      }
    };
    fetchTaken();
    const refresh = setInterval(fetchTaken, 30_000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, [nextClass]);

  const totalBikes = BIKE_CONFIG.total;
  const rowConfig = BIKE_CONFIG.rowConfig;
  const takenCount = takenBikes.length;
  const remaining = Math.max(0, totalBikes - takenCount);
  const filledPct = Math.round((takenCount / totalBikes) * 100);
  const featuredAvailable = !takenBikes.includes(FEATURED_BIKE);

  // Build [start,end] indices per row (1-based bike numbers)
  let cursor = 1;
  const rowRanges = rowConfig.map((count) => {
    const start = cursor;
    const end = cursor + count - 1;
    cursor = end + 1;
    return { start, end };
  });
  const rawPrice = (nextClass?.slot.price ?? '$150 MXN').replace(/\s*MXN\s*$/i, '').trim();

  return (
    <motion.header className="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <motion.div className="hero-bg" style={{ y: yParallax }}>
        <div className="hero-overlay"></div>
        <div className="hero-fog-1" />
        <div className="hero-fog-2" />
        <div className="hero-ambient"></div>
        <svg className="rabbit-trail" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-50 150 Q 300 80 600 130 T 1500 60" stroke="var(--teal-primary)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="8 12" />
        </svg>
      </motion.div>

      <div className="container hero-content">
        <motion.div className="hero-text" variants={containerVariants} initial="hidden" animate="visible">
          <motion.span className="hero-eyebrow" variants={fadeUp} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
            // SPINNING STUDIO · CHIHUAHUA
          </motion.span>

          <motion.h1 className="hero-title" variants={fadeUp} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
            <span className="title-line title-line-1">Pedalea</span>
            <span className="title-line title-line-2 text-red">Rápido</span>
          </motion.h1>

          <motion.p className="hero-tagline" variants={fadeUp} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
            Llega más lejos.
          </motion.p>

          <motion.p className="hero-sub" variants={fadeUp} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
            Spinning de alta intensidad. Reserva tu bici, elige tu lugar y prepárate para sudar.
          </motion.p>

          <motion.div className="hero-ctas" variants={fadeUp} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
            <motion.a
              href="#horarios"
              className="btn btn-primary btn-lg btn-shimmer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reservar Clase <ArrowRight />
            </motion.a>
          </motion.div>

          <motion.div
            className="hero-proof"
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="hero-proof-icon" aria-hidden="true">
              <PowerIcon size={24} />
            </div>
            <div className="proof-text">
              <span className="km-eyebrow">Próximamente en Chihuahua</span>
              <span className="km-headline">Sé parte del <strong>primer ride</strong></span>
              <span className="km-label">Reserva tu lugar antes de que abran las puertas</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="hero-visual" variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
          <motion.div
            className="hero-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="hero-card-bg"></div>
            <div className="hero-card-content">
              {nextClass ? (
                <>
                  <span className="badge badge-live">● PRÓXIMA CLASE · {nextClass.whenLabel}</span>
                  <h3>{nextClass.slot.className}</h3>
                  <p className="hero-card-instructor">
                    <UserIcon size={14} /> Con {nextClass.slot.instructorName}
                  </p>
                  <div className="hero-card-meta">
                    <span className="hero-meta-item"><ClockIcon size={14} /> {nextClass.slot.duration}</span>
                    <span className="hero-meta-item"><ClockIcon size={14} /> {nextClass.slot.hour} {nextClass.slot.period}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="badge badge-live">● ESTA SEMANA</span>
                  <h3>Reserva tu primer ride</h3>
                  <p className="hero-card-instructor">
                    <UserIcon size={14} /> Lun a Sáb · 6 instructores
                  </p>
                  <div className="hero-card-meta">
                    <span className="hero-meta-item"><ClockIcon size={14} /> 45 min</span>
                    <span className="hero-meta-item"><ClockIcon size={14} /> 32 clases/sem</span>
                  </div>
                </>
              )}

              <span className="hero-bike-label">Selecciona tu bici</span>
              <div className="hero-bike-grid" role="group" aria-label="Vista previa del salón">
                {rowRanges.map(({ start, end }, rowIdx) => (
                  <div key={rowIdx} className="hero-bike-row">
                    {Array.from({ length: end - start + 1 }, (_, i) => {
                      const num = start + i;
                      const isTaken = takenBikes.includes(num);
                      const isFeatured = num === FEATURED_BIKE && featuredAvailable;
                      const cls = isTaken
                        ? 'hero-bike taken'
                        : isFeatured
                          ? 'hero-bike selected'
                          : 'hero-bike';
                      return (
                        <span key={num} className={cls} aria-hidden="true">
                          {String(num).padStart(2, '0')}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="hero-card-footer">
                <span>Bike #{String(FEATURED_BIKE).padStart(2, '0')} · Fila 2 centro</span>
                <strong>{rawPrice} MXN</strong>
              </div>

              <div className="hero-card-progress" aria-hidden="true">
                <div className="hero-progress-bar"><span style={{ width: `${filledPct}%` }} /></div>
              </div>
              <div className="hero-card-remaining">
                <GroupIcon size={14} /> {remaining} {remaining === 1 ? 'lugar' : 'lugares'} restantes
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="container hero-features" aria-label="Beneficios del estudio">
        <div className="hero-feature">
          <span className="hero-feature-icon"><EyeIcon size={18} /></span>
          <div className="hero-feature-text">
            <span className="hero-feature-title">Mejor vista</span>
            <span className="hero-feature-sub">Al frente del instructor</span>
          </div>
        </div>
        <div className="hero-feature">
          <span className="hero-feature-icon"><FanIcon size={18} /></span>
          <div className="hero-feature-text">
            <span className="hero-feature-title">Más aire</span>
            <span className="hero-feature-sub">Flujo de aire optimizado</span>
          </div>
        </div>
        <div className="hero-feature">
          <span className="hero-feature-icon"><VolumeIcon size={18} /></span>
          <div className="hero-feature-text">
            <span className="hero-feature-title">Sonido envolvente</span>
            <span className="hero-feature-sub">Experiencia inmersiva</span>
          </div>
        </div>
        <div className="hero-feature">
          <span className="hero-feature-icon"><GroupIcon size={18} /></span>
          <div className="hero-feature-text">
            <span className="hero-feature-title">Comunidad RideOn</span>
            <span className="hero-feature-sub">Más que un workout</span>
          </div>
        </div>
      </div>

      <div className="hero-slash" aria-hidden="true">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <polygon points="0,100 1440,0 1440,100" fill="#FFFFFF" />
          <polygon points="0,100 1440,30 1440,40 0,100" fill="var(--teal-primary)" opacity="0.9" />
        </svg>
      </div>
    </motion.header>
  );
}
