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
import { createClient } from '@/lib/supabase/client';

function slotTo24h(s: ScheduleSlot): number {
  const [h, m] = s.hour.split(':').map(Number);
  if (s.period === 'PM' && h !== 12) return h + 12 + m / 60;
  if (s.period === 'AM' && h === 12) return m / 60;
  return h + m / 60;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

// Mapea una fila de schedule_slots (con join a instructors) al tipo que usa la UI.
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
  instructor: { full_name: string; initial: string; avatar_class: ScheduleSlot['instructorClass'] } | null;
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

// Devuelve los slots de un día de la semana (dow 0-6). Usa la BD si cargó;
// si no, cae a los arrays estáticos (dom = cerrado → []).
function slotsForDow(dow: number, byDow: Record<number, ScheduleSlot[]> | null): ScheduleSlot[] {
  if (byDow && byDow[dow]?.length) return byDow[dow];
  if (byDow && Object.keys(byDow).length > 0) return byDow[dow] ?? [];
  if (dow === 0) return [];
  if (dow === 6) return saturdaySlots;
  return weekdaySlots;
}

function getNextClass(
  byDow: Record<number, ScheduleSlot[]> | null
): { slot: ScheduleSlot; whenLabel: string; dayName: string } | null {
  const now = new Date();
  const dow = now.getDay();

  const todaySlots = slotsForDow(dow, byDow);
  const currentH = now.getHours() + now.getMinutes() / 60;
  const remainingToday = todaySlots
    .filter((s) => slotTo24h(s) > currentH)
    .sort((a, b) => slotTo24h(a) - slotTo24h(b));

  if (remainingToday.length > 0) {
    return { slot: remainingToday[0], whenLabel: 'Hoy', dayName: DAY_NAMES[dow] };
  }

  // Busca el próximo día con clases (hasta 7 días adelante).
  for (let i = 1; i <= 7; i++) {
    const nextDow = (dow + i) % 7;
    const nextSlots = slotsForDow(nextDow, byDow)
      .slice()
      .sort((a, b) => slotTo24h(a) - slotTo24h(b));
    if (nextSlots.length > 0) {
      return { slot: nextSlots[0], whenLabel: i === 1 ? 'Mañana' : DAY_NAMES[nextDow], dayName: DAY_NAMES[nextDow] };
    }
  }
  return null;
}

// Featured bike (popular center, fila 2). Highlighted only when not taken.
const FEATURED_BIKE = BIKE_CONFIG.popular[0] ?? 6;

export default function Hero() {
  const [nextClass, setNextClass] = useState<ReturnType<typeof getNextClass>>(null);
  const [takenBikes, setTakenBikes] = useState<number[]>([]);
  const [slotsByDow, setSlotsByDow] = useState<Record<number, ScheduleSlot[]> | null>(null);
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 400], [0, 80]);

  // Carga los horarios reales de Supabase para calcular la próxima clase
  // con el instructor correcto (los arrays estáticos son solo fallback).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('schedule_slots')
          .select(`
            day_of_week, start_hour, start_minute, duration_min,
            class_title, class_color, level, price_cents, capacity,
            instructor:instructors!inner ( full_name, initial, avatar_class )
          `)
          .eq('active', true)
          .order('day_of_week', { ascending: true })
          .order('start_hour', { ascending: true });
        if (cancelled || error || !data || data.length === 0) return;
        const grouped: Record<number, ScheduleSlot[]> = {};
        for (const row of data as unknown as DbSlotRow[]) {
          (grouped[row.day_of_week] ??= []).push(dbRowToSlot(row));
        }
        setSlotsByDow(grouped);
      } catch {
        /* fallback estático */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setNextClass(getNextClass(slotsByDow));
    const t = setInterval(() => setNextClass(getNextClass(slotsByDow)), 60_000);
    return () => clearInterval(t);
  }, [slotsByDow]);

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
  const rawPrice = (nextClass?.slot.price ?? '$200 MXN').replace(/\s*MXN\s*$/i, '').trim();

  return (
    <motion.header className="hero" initial={false}>
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
        <motion.div className="hero-text" initial={false}>
          <motion.span className="hero-open-badge">
            <span className="hero-open-dot" aria-hidden="true" /> ¡Ya abrimos! · Spinning Studio Chihuahua
          </motion.span>

          <motion.h1 className="hero-title hero-title--quote">
            <span className="title-line title-line-1">No importa lo</span>
            <span className="title-line title-line-1">despacio que</span>
            <span className="title-line title-line-2 text-red">vayas</span>
          </motion.h1>

          <motion.p className="hero-tagline">
            siempre que no te detengas.
          </motion.p>

          <motion.p className="hero-sub">
            Porque entendemos lo importante de ayudarte a lograr tus metas.
          </motion.p>

          <motion.div className="hero-ctas">
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
          >
            <div className="hero-proof-icon" aria-hidden="true">
              <PowerIcon size={24} />
            </div>
            <div className="proof-text">
              <span className="km-eyebrow">Estudio abierto</span>
              <span className="km-headline">Reserva tu <strong>clase de hoy</strong></span>
              <span className="km-label">Lun a Sáb · elige horario y bici en línea en segundos</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div className="hero-visual" initial={false}>
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
                    <UserIcon size={14} /> Lun a Sáb · 3 instructores
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
          <polygon points="0,100 1440,0 1440,100" fill="#05080b" />
          <polygon points="0,100 1440,30 1440,40 0,100" fill="var(--teal-primary)" opacity="0.9" />
        </svg>
      </div>
    </motion.header>
  );
}
