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
  capacity?: number;
  /** true = reserva gratuita, sin pasar por Stripe (evento Gran Apertura). */
  isFree?: boolean;
  /** Fecha calendario fija ISO 'YYYY-MM-DD' para slots de evento (no recurrentes). */
  eventDate?: string;
}

export const weekdaySlots: ScheduleSlot[] = [
  { hour: '06:00', period: 'AM', className: 'Sunrise Ride', duration: '60 min', level: 'Todos los niveles', classColor: 'sunrise', instructorInitial: 'R',   instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '11 disponibles', price: '$200 MXN' },
  { hour: '07:00', period: 'AM', className: 'Power Up', duration: '60 min', level: 'Todos los niveles', classColor: 'power', instructorInitial: 'R', instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '11 disponibles', price: '$200 MXN' },
  { hour: '08:00', period: 'AM', className: 'Energy Boost', duration: '60 min', level: 'Todos los niveles', classColor: 'energy', instructorInitial: 'R', instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '11 disponibles', price: '$200 MXN' },
  { hour: '05:00', period: 'PM', className: 'After Work Ride', duration: '60 min', level: 'Todos los niveles', classColor: 'afterwork', instructorInitial: 'L', instructorName: 'Isamar Frescas', instructorClass: 'avatar-lucia', status: 'available', spotsText: '11 disponibles', price: '$200 MXN' },
  { hour: '06:00', period: 'PM', className: 'Sunset Sprint', duration: '60 min', level: 'Todos los niveles', classColor: 'sunset', instructorInitial: 'L', instructorName: 'Isamar Frescas', instructorClass: 'avatar-lucia', status: 'available', spotsText: '11 disponibles', price: '$200 MXN' },
  { hour: '07:00', period: 'PM', className: 'Night Climb', duration: '60 min', level: 'Todos los niveles', classColor: 'night', instructorInitial: 'L', instructorName: 'Isamar Frescas', instructorClass: 'avatar-lucia', status: 'available', spotsText: '11 disponibles', price: '$200 MXN' },
];

export const saturdaySlots: ScheduleSlot[] = [
  { hour: '09:00', period: 'AM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'sweat', instructorInitial: 'E', instructorName: 'Elmer Alsides', instructorClass: 'avatar-elmer', status: 'available', spotsText: '11 disponibles', price: '$200 MXN' },
  { hour: '10:00', period: 'AM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'marathon', instructorInitial: 'E', instructorName: 'Elmer Alsides', instructorClass: 'avatar-elmer', status: 'available', spotsText: '11 disponibles', price: '$200 MXN' },
];

// ── Gran Apertura: sábado 8 de agosto 2026 ─────────────────────────────
// Clase GRATUITA por hora. Estos slots se reservan sin pasar por Stripe
// (isFree). eventDate ancla la fecha calendario fija (no recurrente).
// Solo esta fecha está habilitada antes de que inicie operación regular (10 ago).
export const EVENT_DATE = '2026-08-08';
// Etiqueta de "día" para aislar las reservas del evento de los sábados normales
// (misma columna `day` en bookings, pero valor distinto → disponibilidad separada).
export const EVENT_DAY_LABEL = 'Sábado 8 Ago';

export const aug8EventSlots: ScheduleSlot[] = [
  { hour: '08:00', period: 'AM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'sunrise', instructorInitial: 'E', instructorName: 'Elmer Alsides',   instructorClass: 'avatar-elmer',   status: 'available', spotsText: '11 disponibles', price: 'Gratis', capacity: 11, isFree: true, eventDate: EVENT_DATE },
  { hour: '09:00', period: 'AM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'power',   instructorInitial: 'I', instructorName: 'Isamar Frescas',  instructorClass: 'avatar-lucia',   status: 'available', spotsText: '11 disponibles', price: 'Gratis', capacity: 11, isFree: true, eventDate: EVENT_DATE },
  { hour: '10:00', period: 'AM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'energy',  instructorInitial: 'R', instructorName: 'Rosario González', instructorClass: 'avatar-rosario', status: 'available', spotsText: '11 disponibles', price: 'Gratis', capacity: 11, isFree: true, eventDate: EVENT_DATE },
  { hour: '11:00', period: 'AM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'sweat',   instructorInitial: 'E', instructorName: 'Elmer Alsides',   instructorClass: 'avatar-elmer',   status: 'available', spotsText: '11 disponibles', price: 'Gratis', capacity: 11, isFree: true, eventDate: EVENT_DATE },
  { hour: '12:00', period: 'PM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'marathon', instructorInitial: 'I', instructorName: 'Isamar Frescas',  instructorClass: 'avatar-lucia',   status: 'available', spotsText: '11 disponibles', price: 'Gratis', capacity: 11, isFree: true, eventDate: EVENT_DATE },
];

// Lunes de inicio de operación regular. Antes de esta fecha, los días entre
// semana se anclan a la SEMANA DE APERTURA (10-14 ago) en vez de la próxima
// ocurrencia; el sábado sigue siendo el evento gratuito (8 ago).
export const OPENING_DATE = '2026-08-09';

const DAY_DOW: Record<DayKey, number> = { lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6 };

function chihuahuaTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chihuahua', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** true si aún no inicia la operación regular (antes del 10 ago, hora Chihuahua). */
export function isPreOpening(): boolean {
  return chihuahuaTodayISO() < OPENING_DATE;
}

/** Fecha ISO para el panel ADMIN (operación regular, sin el evento gratuito).
 *  Pre-apertura: semana de apertura completa lun 10 – sáb 15 ago.
 *  Operación regular: próxima ocurrencia del día. Sirve semana tras semana. */
export function resolveAdminClassDateISO(dayKey: DayKey): string {
  if (chihuahuaTodayISO() < OPENING_DATE) {
    const offset = { lun: 0, mar: 1, mie: 2, jue: 3, vie: 4, sab: 5 }[dayKey] ?? 0;
    const base = new Date(`${OPENING_DATE}T12:00:00`);
    base.setDate(base.getDate() + offset);
    return toISO(base);
  }
  const target = DAY_DOW[dayKey];
  const d = new Date();
  d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7));
  return toISO(d);
}

/** Fecha ISO (YYYY-MM-DD) de la clase para un día de la semana.
 *  Pre-apertura: sábado → evento (8 ago); lun-vie → semana de apertura (10-14 ago).
 *  Operación regular: próxima ocurrencia del día. */
export function resolveClassDateISO(dayKey: DayKey): string {
  if (chihuahuaTodayISO() < OPENING_DATE) {
    if (dayKey === 'sab') return EVENT_DATE;
    const offset = { lun: 0, mar: 1, mie: 2, jue: 3, vie: 4 }[dayKey] ?? 0;
    const base = new Date(`${OPENING_DATE}T12:00:00`);
    base.setDate(base.getDate() + offset);
    return toISO(base);
  }
  const target = DAY_DOW[dayKey];
  const d = new Date();
  d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7));
  return toISO(d);
}

export const days: Array<{ key: DayKey; label: string }> = [
  { key: 'lun', label: 'Lun' }, { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' }, { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' }, { key: 'sab', label: 'Sáb' },
];

/* Studio: 11 bicis. Fila 1: 6 (principiantes, frente al instructor),
   Fila 2: 5 (atrás, más cerca de la cámara). Popular = 09 (centro fila 2) y 04. */
export const BIKE_CONFIG = {
  rows: 2,
  rowConfig: [6, 5] as number[], // bikes per row
  total: 11,
  taken: [] as number[],
  popular: [9, 4],
  // Bicis fuera de servicio (mantenimiento): no se pueden reservar.
  maintenance: [1] as number[],
};

// TODO: When Supabase realtime is integrated, add a server-side fetch here:
//   const { data } = await supabase.from('bookings')
//     .select('bike_number')
//     .eq('class_title', ...).eq('day', ...).eq('hour', ...)
//     .in('status', ['pending','confirmed']);
//   return data.map(b => b.bike_number);
