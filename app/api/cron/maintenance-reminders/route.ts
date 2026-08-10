import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { computeMaintenance } from '@/lib/maintenance';
import { sendMaintenanceReminder } from '@/lib/email';

// Cron diario (Vercel). Envía el recordatorio semanal de la cuota de
// mantenimiento a las suscripciones con adeudo, una vez por semana.
// Protegido con CRON_SECRET (Vercel manda Authorization: Bearer <CRON_SECRET>).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: subs, error } = await supabase
    .from('memberships')
    .select('id, customer_name, customer_email, type, status, created_at, expires_at, maintenance_semester_start, maintenance_paid_cents, maintenance_last_reminder_week, maintenance_exempt')
    .eq('type', 'subscription')
    .eq('status', 'active')
    .eq('maintenance_exempt', false)
    .gt('expires_at', nowIso);

  if (error) {
    console.error('[cron/maintenance] query error:', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  let sent = 0;
  for (const m of subs ?? []) {
    const state = computeMaintenance(m.type, m.created_at, m.maintenance_semester_start, m.maintenance_paid_cents ?? 0);

    // Reset de semestre (persistir nuevo inicio + pagos a 0 + recordatorios a 0).
    if (state.needsSemesterReset) {
      await supabase
        .from('memberships')
        .update({
          maintenance_semester_start: state.semesterStartISO,
          maintenance_paid_cents: 0,
          maintenance_last_reminder_week: 0,
        })
        .eq('id', m.id);
      m.maintenance_last_reminder_week = 0;
    }

    const lastWeek = m.maintenance_last_reminder_week ?? 0;
    // Recordatorio semanal solo durante (y poco después de) el primer mes.
    const shouldRemind =
      state.owedCents > 0 &&
      state.weeksElapsed >= 1 &&
      state.weeksElapsed <= 8 &&
      lastWeek < state.weeksElapsed;

    if (shouldRemind) {
      await sendMaintenanceReminder({
        customerName: m.customer_name,
        customerEmail: m.customer_email,
        owedPesos: Math.round(state.owedCents / 100),
        blocked: state.blocked,
      });
      await supabase
        .from('memberships')
        .update({ maintenance_last_reminder_week: state.weeksElapsed })
        .eq('id', m.id);
      sent++;
    }
  }

  console.log(`[cron/maintenance] recordatorios enviados: ${sent}`);
  return NextResponse.json({ ok: true, reminders_sent: sent });
}
