import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBookingConfirmation } from '@/lib/email';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { aug8EventSlots, EVENT_DATE, EVENT_DAY_LABEL, BIKE_CONFIG } from '@/data/schedule';

// Conjunto permitido de clases gratuitas del evento: "className|HH:MM AM/PM"
const ALLOWED = new Set(
  aug8EventSlots.map((s) => `${s.className}|${s.hour} ${s.period}`)
);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`free-booking:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un momento.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      bike_number,
      bike_row,
      class_title,
      instructor_name,
      hour,
      goal,
    } = body;

    // Validación básica
    if (!customer_name?.trim() || !customer_email?.trim()) {
      return NextResponse.json({ error: 'Nombre y correo son obligatorios' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return NextResponse.json({ error: 'Correo electrónico inválido' }, { status: 400 });
    }
    const bikeNum = Number(bike_number);
    const bikeRowNum = Number(bike_row);
    if (!Number.isInteger(bikeNum) || bikeNum < 1 || bikeNum > BIKE_CONFIG.total) {
      return NextResponse.json({ error: 'Bici inválida' }, { status: 400 });
    }
    if (BIKE_CONFIG.maintenance.includes(bikeNum)) {
      return NextResponse.json({ error: 'Esa bici está en mantenimiento. Elige otra.' }, { status: 400 });
    }

    // El servidor solo permite reservar clases del evento gratuito — nunca confiar en el cliente
    if (!ALLOWED.has(`${class_title}|${hour}`)) {
      return NextResponse.json(
        { error: 'Esta reserva gratuita solo aplica para las clases de la Gran Apertura.' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim().toLowerCase(),
        customer_phone: customer_phone?.trim() || null,
        bike_number: bikeNum,
        bike_row: bikeRowNum,
        class_title,
        instructor_name: instructor_name || '',
        day: EVENT_DAY_LABEL,
        hour,
        class_date: EVENT_DATE,
        amount_paid: 0,
        status: 'confirmed',
        goal: goal?.trim() || null,
        stripe_session_id: `free:aug8:${crypto.randomUUID()}`,
      })
      .select()
      .single();

    if (insertError || !booking) {
      if (insertError?.code === '23505') {
        return NextResponse.json({ error: 'Esa bici acaba de ocuparse. Elige otra.' }, { status: 409 });
      }
      console.error('[bookings/free] insert error:', insertError);
      return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 });
    }

    const confirmationNumber = booking.id.substring(0, 8).toUpperCase();
    await supabase.from('bookings').update({ confirmation_number: confirmationNumber }).eq('id', booking.id);

    // Correo de confirmación — no bloquea la reserva si Resend no está configurado
    try {
      await sendBookingConfirmation({
        customerName: customer_name.trim(),
        customerEmail: customer_email.trim(),
        classTitle: class_title,
        instructorName: instructor_name || '',
        day: EVENT_DAY_LABEL,
        hour,
        classDate: EVENT_DATE,
        bikeNumber: bikeNum,
        bikeRow: bikeRowNum,
        amount: 0,
        confirmationNumber,
        goal: goal || undefined,
      });
    } catch (e) {
      console.error('[bookings/free] email failed (non-fatal):', e);
    }

    return NextResponse.json({ free: true, confirmation_number: confirmationNumber });
  } catch (err) {
    console.error('[bookings/free] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
