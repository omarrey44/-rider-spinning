// ============================================================
// Cuota de mantenimiento — cobro semanal el primer mes de cada semestre
// ============================================================
// La cuota de $250 se cobra SOLO durante el primer mes de cada semestre
// (bloque de 6 meses anclado a la fecha de alta de la membresía). Se divide
// en 4 semanas: $63, $63, $63, $61 (= $250). La 1ª semana es omitible; si al
// llegar la 2ª semana sigue sin pagar, se bloquean las reservas hasta que
// pague (Stripe) o el admin registre el pago en efectivo.
//
// Aplica solo a membresías type='subscription' (no packs).

export const MAINTENANCE_TOTAL_CENTS = 25000;
// Monto acumulado adeudado al terminar cada semana (índice = semanas transcurridas).
// semana 0 → nada; 1 → 63; 2 → 126; 3 → 189; 4 → 250.
export const MAINTENANCE_CUMULATIVE_CENTS = [0, 6300, 12600, 18900, 25000];
export const MAINTENANCE_WEEK_AMOUNTS_CENTS = [6300, 6300, 6300, 6100];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const SEMESTER_MONTHS = 6;

export const pesosFromCents = (cents: number): string =>
  `$${(cents / 100).toLocaleString('es-MX')}`;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  const target = new Date(d);
  target.setMonth(targetMonth);
  // Ajuste por meses cortos (p. ej. 31 ago + 6 = feb): si el día se desbordó,
  // retrocede al último día del mes objetivo.
  if (target.getDate() !== d.getDate()) target.setDate(0);
  return target;
}

/** Inicio del semestre vigente: created_at + 6*k meses, el mayor que sea <= now. */
export function currentSemesterStart(createdAt: Date, now: Date): Date {
  let start = new Date(createdAt);
  // Guard contra bucles largos (máx ~200 años de semestres).
  for (let i = 0; i < 400; i++) {
    const next = addMonths(start, SEMESTER_MONTHS);
    if (next.getTime() <= now.getTime()) start = next;
    else break;
  }
  return start;
}

export interface MaintenanceState {
  /** true solo para suscripciones. */
  applies: boolean;
  semesterStartISO: string;
  /** Semanas completas desde el inicio del semestre (0 = primeros 6 días). */
  weeksElapsed: number;
  /** Semanas cobrables consideradas (cap 4). */
  dueWeeks: number;
  cumulativeDueCents: number;
  paidCents: number;
  /** Monto que debe pagar ahora para ponerse al día (0 si al corriente). */
  owedCents: number;
  /** Monto vencido cuya semana de gracia ya pasó (dispara el bloqueo). */
  overdueCents: number;
  /** true si ya pagó los $250 completos del semestre. */
  fullyPaid: boolean;
  /** true si debe pagar y ya pasó la semana de gracia → reservas bloqueadas. */
  blocked: boolean;
  /** Fecha del próximo cobro dentro del primer mes (null si ya no hay). */
  nextChargeISO: string | null;
  /** true si el semestre guardado difiere del vigente → hay que resetear pagos. */
  needsSemesterReset: boolean;
  /** true si la membresía está exenta (paga en efectivo): sin cobro ni bloqueo. */
  exempt: boolean;
}

/**
 * Calcula el estado de la cuota de mantenimiento.
 * @param type            tipo de membresía ('subscription' | 'pack')
 * @param createdAtISO    fecha de alta de la membresía (ancla del 1er semestre)
 * @param storedStartISO  maintenance_semester_start guardado (o null)
 * @param paidCentsRaw    maintenance_paid_cents guardado
 * @param now             fecha actual
 */
export function computeMaintenance(
  type: string,
  createdAtISO: string,
  storedStartISO: string | null,
  paidCentsRaw: number,
  now: Date = new Date(),
  exempt: boolean = false,
): MaintenanceState {
  const created = new Date(createdAtISO);
  const semStart = currentSemesterStart(created, now);
  const semStartISO = semStart.toISOString();

  // Exenta (paga en efectivo): sin cobro, sin bloqueo, sin recordatorios.
  if (exempt) {
    return {
      applies: type === 'subscription',
      semesterStartISO: semStartISO,
      weeksElapsed: 0,
      dueWeeks: 0,
      cumulativeDueCents: 0,
      paidCents: 0,
      owedCents: 0,
      overdueCents: 0,
      fullyPaid: true,
      blocked: false,
      nextChargeISO: null,
      needsSemesterReset: false,
      exempt: true,
    };
  }

  // Si el semestre vigente cambió respecto al guardado, los pagos previos no
  // cuentan para este semestre → resetear.
  const needsSemesterReset = (storedStartISO ?? null) !== semStartISO;
  const paidCents = needsSemesterReset ? 0 : Math.max(0, paidCentsRaw || 0);

  const weeksElapsed = Math.max(0, Math.floor((now.getTime() - semStart.getTime()) / WEEK_MS));
  const dueWeeks = Math.min(weeksElapsed, 4);
  const cumulativeDueCents = MAINTENANCE_CUMULATIVE_CENTS[dueWeeks];
  const owedCents = Math.max(0, Math.min(MAINTENANCE_TOTAL_CENTS, cumulativeDueCents) - paidCents);
  const fullyPaid = paidCents >= MAINTENANCE_TOTAL_CENTS;

  const applies = type === 'subscription';
  // Gracia de 1 semana por cargo: cada semana w vence, pero puede pagarse hasta
  // que empieza la semana w+1. Se bloquea solo si hay un cargo vencido cuya
  // semana de gracia ya pasó (es decir, atrasado más de una semana).
  const gracedWeeks = Math.min(Math.max(weeksElapsed - 1, 0), 4);
  const overdueCents = Math.max(0, MAINTENANCE_CUMULATIVE_CENTS[gracedWeeks] - paidCents);
  const blocked = applies && overdueCents > 0;

  // Próximo cobro: siguiente frontera semanal dentro del 1er mes (semanas 1..4).
  let nextChargeISO: string | null = null;
  if (applies && weeksElapsed < 4 && !fullyPaid) {
    const nextWeek = weeksElapsed + 1; // 1..4
    nextChargeISO = new Date(semStart.getTime() + nextWeek * WEEK_MS).toISOString();
  }

  return {
    applies,
    semesterStartISO: semStartISO,
    weeksElapsed,
    dueWeeks,
    cumulativeDueCents,
    paidCents,
    owedCents,
    overdueCents,
    fullyPaid,
    blocked,
    nextChargeISO,
    needsSemesterReset,
    exempt: false,
  };
}
