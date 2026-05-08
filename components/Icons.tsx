/* ============================================================
   SVG icon set — Lucide-style, stroke 2px, currentColor.
   ============================================================ */

const baseProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

interface IconProps {
  className?: string;
  size?: number;
}

export const ArrowRight = ({ className = '', size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} strokeWidth={2.5} className={className}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export const PlayIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const ClockIcon = ({ className = '', size }: IconProps) => (
  <svg viewBox="0 0 24 24" {...baseProps} {...(size ? { width: size, height: size } : {})} className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);

export const SignalIcon = ({ className = '', size }: IconProps) => (
  <svg viewBox="0 0 24 24" {...baseProps} {...(size ? { width: size, height: size } : {})} className={className}>
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="6" />
  </svg>
);

/* === Iconos para BikeSelector / detalles de reserva === */

// Clase / actividad: representada como un rayo (intensidad)
export const BoltIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

// Instructor: persona
export const UserIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Calendario simple (día / fecha)
export const CalendarIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Calendario con días marcados (fecha específica)
export const CalendarDaysIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </svg>
);

// Reloj de alarma (horario)
export const AlarmClockIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2" />
    <path d="M5 3 2 6" />
    <path d="m22 6-3-3" />
    <path d="M6.38 18.7 4 21" />
    <path d="M17.64 18.67 20 21" />
  </svg>
);

// Cronómetro (duración)
export const StopwatchIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <circle cx="12" cy="14" r="8" />
    <path d="M12 10v4l2.5 2.5" />
    <path d="M9 2h6" />
    <path d="M12 2v3" />
  </svg>
);

// Ventilador
export const FanIcon = ({ className = '', size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <path d="M10.83 16.4a4.5 4.5 0 1 1-7.66-3.74 14.7 14.7 0 0 0 6.04 3.07" />
    <path d="M16.4 13.17a4.5 4.5 0 1 1-3.74 7.66 14.7 14.7 0 0 0 3.07-6.04" />
    <path d="M13.17 7.6a4.5 4.5 0 1 1 7.66 3.74 14.7 14.7 0 0 0-6.04-3.07" />
    <path d="M7.6 10.83A4.5 4.5 0 1 1 11.34 3.17 14.7 14.7 0 0 0 8.27 9.21" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Luna (estado vacío de "no más clases hoy")
export const MoonIcon = ({ className = '', size = 28 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

// Información (note)
export const InfoIcon = ({ className = '', size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

// Check (confirmación)
export const CheckIcon = ({ className = '', size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} strokeWidth={2.5} className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Mail (lookup form)
export const MailIcon = ({ className = '', size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

// Bicicleta (lookup empty state)
export const BikeIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} className={className}>
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 17.5V14l-3-3 4-3 2 3h2" />
  </svg>
);
