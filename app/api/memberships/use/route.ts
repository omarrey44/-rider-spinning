import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBookingConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      membership_id,
      customer_name,
      customer_email,
      bike_number,
      bike_row,
      class_title,
      instructor_name,
      day,
      hour,
      class_date,
    } = body;

    if (!membership_id || !customer_email || !bike_number || !day || !hour || !class_date) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch membership
    const { data: membership, error: mError } = await supabase
      .from('memberships')
      .select('*')
      .eq('id', membership_id)
      .single();

    if (mError || !membership) {
      return NextResponse.json({ error: 'Membresía no encontrada' }, { status: 404 });
    }

    // 2. Verify ownership
    if (membership.customer_email.toLowerCase() !== customer_email.toLowerCase()) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 3. Validate status
    if (membership.status !== 'active') {
      return NextResponse.json({ error: 'Membresía inactiva o cancelada' }, { status: 400 });
    }

    // 3. Validate expiry
    if (new Date(membership.expires_at) < new Date()) {
      await supabase.from('memberships').update({ status: 'expired' }).eq('id', membership_id);
      return NextResponse.json({ error: 'Tu membresía ha expirado' }, { status: 400 });
    }

    // 4. Pack: check credits remaining
    if (membership.type === 'pack') {
      if (membership.credits_used >= membership.credits_total) {
        return NextResponse.json({ error: 'No tienes créditos disponibles en tu pack' }, { status: 400 });
      }
    }

    // 5. Enforce 1 class per day limit
    const { data: sameDayBookings, error: sdError } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_email', customer_email.toLowerCase())
      .eq('class_date', class_date)
      .in('status', ['confirmed', 'pending']);

    if (sdError) {
      return NextResponse.json({ error: 'Error al verificar disponibilidad' }, { status: 500 });
    }

    if (sameDayBookings && sameDayBookings.length > 0) {
      return NextResponse.json({
        error: 'Ya tienes una clase reservada ese día. Tu membresía permite 1 clase por día.',
      }, { status: 409 });
    }

    // 6. Check bike not already taken
    const pendingCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: bikeCheck } = await supabase
      .from('bookings')
      .select('id')
      .eq('class_title', class_title)
      .eq('day', day)
      .eq('hour', hour)
      .eq('bike_number', bike_number)
      .or(`status.eq.confirmed,and(status.eq.pending,created_at.gte.${pendingCutoff})`);

    if (bikeCheck && bikeCheck.length > 0) {
      return NextResponse.json({ error: 'Esta bici ya fue reservada. Selecciona otra.' }, { status: 409 });
    }

    // 7. Create confirmed booking
    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .insert({
        customer_name: customer_name || membership.customer_name,
        customer_email: customer_email.toLowerCase(),
        customer_phone: membership.customer_phone || null,
        bike_number,
        bike_row,
        class_title,
        instructor_name,
        day,
        hour,
        class_date,
        amount_paid: 0,
        status: 'confirmed',
        goal: membership.goal || null,
      })
      .select()
      .single();

    if (bError || !booking) {
      if (bError?.code === '23505') {
        return NextResponse.json({ error: 'Esta bici ya fue reservada. Selecciona otra.' }, { status: 409 });
      }
      console.error('[memberships/use] booking insert error:', bError);
      return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
    }

    const confirmationNumber = booking.id.substring(0, 8).toUpperCase();

    await supabase
      .from('bookings')
      .update({ confirmation_number: confirmationNumber })
      .eq('id', booking.id);

    // 8. Decrement pack credits
    if (membership.type === 'pack') {
      await supabase
        .from('memberships')
        .update({ credits_used: membership.credits_used + 1 })
        .eq('id', membership_id);
    }

    console.log(`[memberships/use] Booked ${class_title} ${day} ${hour} bike#${bike_number} for ${customer_email} via ${membership.type}`);

    await sendBookingConfirmation({
      customerName: customer_name || membership.customer_name,
      customerEmail: customer_email.toLowerCase(),
      classTitle: class_title,
      instructorName: instructor_name,
      day,
      hour,
      classDate: class_date || null,
      bikeNumber: bike_number,
      bikeRow: bike_row,
      amount: 0,
      confirmationNumber,
      goal: membership.goal || undefined,
    });

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      confirmation_number: confirmationNumber,
    });
  } catch (err) {
    console.error('[memberships/use]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
