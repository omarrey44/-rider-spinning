'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from './Icons';
import { weekdaySlots, saturdaySlots, ScheduleSlot } from '@/data/schedule';

function slotTo24h(s: ScheduleSlot): number {
  const [h, m] = s.hour.split(':').map(Number);
  if (s.period === 'PM' && h !== 12) return h + 12 + m / 60;
  if (s.period === 'AM' && h === 12) return m / 60;
  return h + m / 60;
}

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

  const nextDow = (dow + 1) % 7;
  const nextSlots = nextDow === 6 ? saturdaySlots : nextDow === 0 ? [] : weekdaySlots;
  if (nextSlots.length > 0) {
    return { slot: nextSlots[0], whenLabel: 'Mañana' };
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


export default function Hero() {
  const [nextClass, setNextClass] = useState<ReturnType<typeof getNextClass>>(null);
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 400], [0, 80]);

  useEffect(() => {
    setNextClass(getNextClass());
    const t = setInterval(() => setNextClass(getNextClass()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.header className="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <motion.div className="hero-bg" style={{ y: yParallax }}>
        <div className="hero-overlay"></div>
        <motion.div className="hero-fog-1" animate={{ x: [0, 10, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="hero-fog-2" animate={{ x: [0, -10, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
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
            <span className="title-line">
              <span style={{ fontWeight: 700 }}>Pedalea</span> <span className="text-red" style={{ fontWeight: 900, fontStyle: 'italic' }}>Rápido</span>
            </span>
            <span className="title-line">
              <span style={{ fontWeight: 700 }}>Llega</span> <span className="text-red" style={{ fontWeight: 900, fontStyle: 'italic' }}>Lejos</span>
            </span>
          </motion.h1>

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
          </motion.div>
        </motion.div>

        <motion.div className="hero-visual" variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}>
          <motion.div
            className="hero-card"
            whileHover={{ rotate: 0, scale: 1.02 }}
            initial={{ rotate: -1.5 }}
            animate={{ boxShadow: [
              '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(29, 212, 232, 0.08)',
              '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(29, 212, 232, 0.15)',
              '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(29, 212, 232, 0.08)',
            ] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: 'loop' } as any}
          >
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
          </motion.div>
        </motion.div>
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
