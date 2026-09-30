// Mensajes de la regla vigente en /api/bookings/cancel:
// cancelación con >= 1 h; reembolso de clase suelta con > 4 h.
export const CANCELLATION_COPY = {
  deadline: 'Cancela hasta 1 h antes',
  singleRefund: 'Reembolso total al cancelar con más de 4 h de anticipación',
} as const;
