import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

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

// Registra una membresía/pack pagado EN EFECTIVO desde el panel admin.
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { customer_name, customer_email, customer_phone, type, amount_paid } = body;

    if (!customer_name?.trim() || !customer_email?.trim()) {
      return NextResponse.json({ error: 'Nombre y correo son requeridos' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
    }
    if (type !== 'pack' && type !== 'subscription') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const amountCents = typeof amount_paid === 'number' && amount_paid >= 0
      ? amount_paid
      : (type === 'pack' ? 30000 : 65000);

    const isPack = type === 'pack';
    const confirmationNumber = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + (isPack ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString();

    const supabase = createAdminClient();
    const { data: membership, error } = await supabase
      .from('memberships')
      .insert({
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim().toLowerCase(),
        customer_phone: customer_phone?.trim() || null,
        type,
        credits_total: isPack ? 3 : null,
        credits_used: 0,
        expires_at: expiresAt,
        status: 'active',
        confirmation_number: confirmationNumber,
        amount_paid: amountCents,
        // Origen: efectivo registrado por admin (distingue de los pagos Stripe cs_...).
        stripe_session_id: `admin:cash:${type}:${randomUUID()}`,
      })
      .select()
      .single();

    if (error) {
      console.error('[admin/memberships] insert error:', error);
      return NextResponse.json({ error: 'Error al registrar la membresía' }, { status: 500 });
    }

    console.log(`[admin/memberships] ${type} en efectivo: ${confirmationNumber} por ${user.email}`);
    return NextResponse.json({ membership, confirmation_number: confirmationNumber });
  } catch (err) {
    console.error('[admin/memberships]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
