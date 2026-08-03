import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { BIKE_CONFIG } from '@/data/schedule';
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

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createAdminClient();

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/bookings] Supabase error:', error);
      return NextResponse.json(
        { error: 'Error al cargar reservas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (err) {
    console.error('[admin/bookings] Error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      customer_name, customer_email, customer_phone,
      bike_number, bike_row,
      class_title, instructor_name, day, hour,
      class_date,
      amount_paid,
      goal,
      payment_type,
    } = body;

    if (!customer_name?.trim() || !customer_email?.trim() || !bike_number || !bike_row || !class_title || !day || !hour) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (BIKE_CONFIG.maintenance.includes(Number(bike_number))) {
      return NextResponse.json({ error: 'Esa bici está en mantenimiento. Elige otra.' }, { status: 400 });
    }
    const amountCents = typeof amount_paid === 'number' && amount_paid >= 0 ? amount_paid : 20000;

    const supabase = createAdminClient();

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim().toLowerCase(),
        customer_phone: customer_phone?.trim() || null,
        bike_number: Number(bike_number),
        bike_row: Number(bike_row),
        class_title,
        instructor_name,
        day,
        hour,
        class_date: (typeof class_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(class_date)) ? class_date : null,
        amount_paid: amountCents,
        status: 'confirmed',
        goal: goal?.trim() || null,
        stripe_session_id: payment_type && payment_type !== 'cash'
          ? `admin:${payment_type}:${randomUUID()}`
          : null,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Esta bici ya está reservada para esa clase.' }, { status: 409 });
      }
      console.error('[admin/bookings POST]', insertError);
      return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 });
    }

    const confirmationNumber = booking.id.substring(0, 8).toUpperCase();
    await supabase.from('bookings').update({ confirmation_number: confirmationNumber }).eq('id', booking.id);

    console.log(`[admin/bookings] Cash booking created: ${booking.id} by ${user.email}`);
    return NextResponse.json({ booking: { ...booking, confirmation_number: confirmationNumber } });
  } catch (err) {
    console.error('[admin/bookings POST]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
