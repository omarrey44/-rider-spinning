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
}

export const weekdaySlots: ScheduleSlot[] = [
  { hour: '06:00', period: 'AM', className: 'Sunrise Ride', duration: '60 min', level: 'Todos los niveles', classColor: 'sunrise', instructorInitial: 'R',   instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '10 disponibles', price: '$150 MXN' },
  { hour: '07:00', period: 'AM', className: 'Power Up', duration: '60 min', level: 'Todos los niveles', classColor: 'power', instructorInitial: 'R', instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '10 disponibles', price: '$150 MXN' },
  { hour: '08:00', period: 'AM', className: 'Energy Boost', duration: '60 min', level: 'Todos los niveles', classColor: 'energy', instructorInitial: 'R', instructorName: 'Rosario González Muñoz', instructorClass: 'avatar-rosario', status: 'available', spotsText: '10 disponibles', price: '$150 MXN' },
  { hour: '05:00', period: 'PM', className: 'After Work Ride', duration: '60 min', level: 'Todos los niveles', classColor: 'afterwork', instructorInitial: 'L', instructorName: 'Lucía Frescas González', instructorClass: 'avatar-lucia', status: 'available', spotsText: '10 disponibles', price: '$150 MXN' },
  { hour: '06:00', period: 'PM', className: 'Sunset Sprint', duration: '60 min', level: 'Todos los niveles', classColor: 'sunset', instructorInitial: 'L', instructorName: 'Lucía Frescas González', instructorClass: 'avatar-lucia', status: 'available', spotsText: '10 disponibles', price: '$150 MXN' },
  { hour: '07:00', period: 'PM', className: 'Night Climb', duration: '60 min', level: 'Todos los niveles', classColor: 'night', instructorInitial: 'L', instructorName: 'Lucía Frescas González', instructorClass: 'avatar-lucia', status: 'available', spotsText: '10 disponibles', price: '$150 MXN' },
];

export const saturdaySlots: ScheduleSlot[] = [
  { hour: '09:00', period: 'AM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'sweat', instructorInitial: 'E', instructorName: 'Elmer Alsides', instructorClass: 'avatar-elmer', status: 'available', spotsText: '10 disponibles', price: '$150 MXN' },
  { hour: '10:00', period: 'AM', className: 'Clase de Muestra', duration: '60 min', level: 'Todos los niveles', classColor: 'marathon', instructorInitial: 'E', instructorName: 'Elmer Alsides', instructorClass: 'avatar-elmer', status: 'available', spotsText: '10 disponibles', price: '$150 MXN' },
];

export const days: Array<{ key: DayKey; label: string }> = [
  { key: 'lun', label: 'Lun' }, { key: 'mar', label: 'Mar' },
  { key: 'mie', label: 'Mié' }, { key: 'jue', label: 'Jue' },
  { key: 'vie', label: 'Vie' }, { key: 'sab', label: 'Sáb' },
];

/* Studio: 10 bicis. Fila 1: 4 (principiantes), Fila 2: 3, Fila 3: 3.
   Popular = centro fila 2 (bike 6). */
export const BIKE_CONFIG = {
  rows: 3,
  rowConfig: [4, 3, 3] as number[], // bikes per row
  total: 10,
  taken: [] as number[],
  popular: [6],
};

// TODO: When Supabase realtime is integrated, add a server-side fetch here:
//   const { data } = await supabase.from('bookings')
//     .select('bike_number')
//     .eq('class_title', ...).eq('day', ...).eq('hour', ...)
//     .in('status', ['pending','confirmed']);
//   return data.map(b => b.bike_number);
