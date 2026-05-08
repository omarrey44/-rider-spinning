export type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab';
export type SlotStatus = 'available' | 'few' | 'full';

export interface ScheduleSlot {
  hour: string;
  period: 'AM' | 'PM';
  className: string;
  duration: string;
  level: string;
  classColor: string;
  instructorInitial: string;
  instructorName: string;
  instructorClass: 'avatar-rosario' | 'avatar-lucia' | 'avatar-elmer';
  status: SlotStatus;
  spotsText: string;
  price: string;
}

export const weekdaySlots: ScheduleSlot[] = [
  { hour: '06:00', period: 'AM', className: 'Sunrise Ride', duration: '60 min', level: 'Principiante', classColor: 'sunrise', instructorInitial: 'R',   instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '24 disponibles', price: '$220' },
  { hour: '07:00', period: 'AM', className: 'Power Up', duration: '60 min', level: 'Intermedio', classColor: 'power', instructorInitial: 'R', instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '24 disponibles', price: '$220' },
  { hour: '08:00', period: 'AM', className: 'Energy Boost', duration: '60 min', level: 'Intermedio', classColor: 'energy', instructorInitial: 'R', instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '24 disponibles', price: '$220' },
  { hour: '05:00', period: 'PM', className: 'After Work Ride', duration: '60 min', level: 'Todos los niveles', classColor: 'afterwork', instructorInitial: 'L', instructorName: 'Lucía Frescas González', instructorClass: 'avatar-lucia', status: 'available', spotsText: '24 disponibles', price: '$220' },
  { hour: '06:00', period: 'PM', className: 'Sunset Sprint', duration: '60 min', level: 'Avanzado', classColor: 'sunset', instructorInitial: 'L', instructorName: 'Lucía Frescas González', instructorClass: 'avatar-lucia', status: 'available', spotsText: '24 disponibles', price: '$220' },
  { hour: '07:00', period: 'PM', className: 'Night Climb', duration: '60 min', level: 'Avanzado', classColor: 'night', instructorInitial: 'L', instructorName: 'Lucía Frescas González', instructorClass: 'avatar-lucia', status: 'available', spotsText: '24 disponibles', price: '$220' },
];

export const saturdaySlots: ScheduleSlot[] = [
  { hour: '09:00', period: 'AM', className: 'Saturday Sweat', duration: '60 min', level: 'Todos los niveles', classColor: 'sweat', instructorInitial: 'E', instructorName: 'Elmer Alsides', instructorClass: 'avatar-elmer', status: 'available', spotsText: '24 disponibles', price: '$240' },
  { hour: '10:00', period: 'AM', className: 'Weekend Marathon', duration: '60 min', level: 'Avanzado', classColor: 'marathon', instructorInitial: 'E', instructorName: 'Elmer Alsides', instructorClass: 'avatar-elmer', status: 'available', spotsText: '24 disponibles', price: '$240' },
];

export const days: Array<{ key: DayKey; label: string }> = [
  { key: 'lun', label: 'Lun' }, { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' }, { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' }, { key: 'sab', label: 'Sáb' },
];

export const BIKE_CONFIG = {
  rows: 4,
  cols: 6,
  taken: [] as number[],
  popular: [7, 8, 9, 10],
};

/* ============================================================
   getTakenBikes — placeholder mientras no hay realtime de Supabase.
   Genera un set deterministicó de bicis ocupadas a partir de un seed
   (className + day), para que cada clase tenga su propio patrón pero
   estable mientras navegas. Cuando se integre la query real, se
   reemplaza esta función por un fetch a `bookings`.
   ============================================================ */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTakenBikes(_seed: string): number[] {
  // Pre-launch: el negocio aún no opera, no hay bookings reales.
  // Todas las bicis disponibles para no inflar artificialmente el "ocupado".
  // Cuando se conecte Supabase realtime, esta función pasa a hacer:
  //   const { data } = await supabase.from('bookings')
  //     .select('bike_number')
  //     .eq('class_title', ...).eq('day', ...).eq('hour', ...)
  //     .in('status', ['pending','confirmed']);
  //   return data.map(b => b.bike_number);
  return [];
}

// Helper interno preservado por si quieres reactivar el modo "demo" en
// algún branch promocional (todas las clases con bikes ocupadas pseudo-random).
function _generateDemoTakenBikes(seed: string): number[] {
  if (!seed) return [];
  const total = BIKE_CONFIG.rows * BIKE_CONFIG.cols;
  const rng = mulberry32(hashString(seed));
  const count = 5 + Math.floor(rng() * 7);
  const taken = new Set<number>();
  while (taken.size < count) {
    taken.add(1 + Math.floor(rng() * total));
  }
  return Array.from(taken).sort((a, b) => a - b);
}
void _generateDemoTakenBikes; // keep referenced
