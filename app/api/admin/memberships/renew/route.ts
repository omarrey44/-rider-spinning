import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

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

// Registra la renovación EN EFECTIVO de una mensualidad: extiende +30 días
// (desde hoy o desde el vencimiento vigente, lo que sea mayor) y la reactiva.
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { membership_id } = await req.json();
    if (!membership_id) return NextResponse.json({ error: 'Falta membership_id' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: mem } = await supabase
      .from('memberships')
      .select('id, type, expires_at')
      .eq('id', membership_id)
      .maybeSingle();

    if (!mem) return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 });
    if (mem.type !== 'subscription') {
      return NextResponse.json({ error: 'La renovación solo aplica a mensualidades' }, { status: 400 });
    }

    // Si sigue vigente, se suma al vencimiento (no se pierden días). Si expiró,
    // cuenta desde hoy.
    const now = Date.now();
    const base = Math.max(now, new Date(mem.expires_at).getTime());
    const newExpiry = new Date(base + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('memberships')
      .update({ expires_at: newExpiry, status: 'active' })
      .eq('id', membership_id);

    if (error) {
      console.error('[admin/memberships/renew]', error);
      return NextResponse.json({ error: 'Error al registrar la renovación' }, { status: 500 });
    }

    console.log(`[admin/memberships/renew] Renovación efectivo ${membership_id} → ${newExpiry} por ${user.email}`);
    return NextResponse.json({ success: true, expires_at: newExpiry });
  } catch (err) {
    console.error('[admin/memberships/renew]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
