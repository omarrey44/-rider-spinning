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
