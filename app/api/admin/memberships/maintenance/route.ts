import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { computeMaintenance, MAINTENANCE_TOTAL_CENTS } from '@/lib/maintenance';

async function getAuthUser() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

// Registra el pago EN EFECTIVO de la cuota de mantenimiento del semestre vigente
// → marca la cuota como pagada por completo y levanta el bloqueo de reservas.
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { membership_id, exempt } = await req.json();
    if (!membership_id) return NextResponse.json({ error: 'Falta membership_id' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: mem } = await supabase
      .from('memberships')
      .select('id, type, created_at, maintenance_semester_start, maintenance_paid_cents')
      .eq('id', membership_id)
      .maybeSingle();

    if (!mem) return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 });
    if (mem.type !== 'subscription') {
      return NextResponse.json({ error: 'La cuota solo aplica a mensualidades' }, { status: 400 });
    }

    // Si viene `exempt` (booleano) → alterna la exención permanente (paga en
    // efectivo: sin cobro/​bloqueo/​recordatorio). Si no viene → marca el
    // semestre vigente como pagado por completo.
    if (typeof exempt === 'boolean') {
      const { error } = await supabase
        .from('memberships')
        .update({ maintenance_exempt: exempt })
        .eq('id', membership_id);
      if (error) {
        console.error('[admin/memberships/maintenance] exempt error:', error);
        return NextResponse.json({ error: 'Error al actualizar la exención' }, { status: 500 });
      }
      console.log(`[admin/memberships/maintenance] exención=${exempt} para ${membership_id} por ${user.email}`);
      return NextResponse.json({ success: true, exempt });
    }

    // Semestre vigente → marcar pagado completo.
    const state = computeMaintenance(mem.type, mem.created_at, mem.maintenance_semester_start, mem.maintenance_paid_cents);

    const { error } = await supabase
      .from('memberships')
      .update({
        maintenance_semester_start: state.semesterStartISO,
        maintenance_paid_cents: MAINTENANCE_TOTAL_CENTS,
      })
      .eq('id', membership_id);

    if (error) {
      console.error('[admin/memberships/maintenance]', error);
      return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 });
    }

    console.log(`[admin/memberships/maintenance] Cuota en efectivo marcada pagada para ${membership_id} por ${user.email}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/memberships/maintenance]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
