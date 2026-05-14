import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
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
      date_time,
      class_date,
      day,
      hour,
      duration = '45 min',
      amount_cents,
      currency,
    } = body;

    if (!customer_name || !customer_email || !bike_number || !day || !hour) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: nombre, correo, bicicleta, día y hora' },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3004';

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe no está configurado. Define STRIPE_SECRET_KEY' },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        bike_number,
        bike_row,
        class_title: class_title || '',
        instructor_name: instructor_name || '',
        day: day || '',
        hour: hour || '',
        class_date: class_date || null,
        amount_paid: amount_cents,
        status: 'pending',
      })
      .select();

    if (bookingError || !booking || booking.length === 0) {
      console.error('[checkout] Supabase insert error:', bookingError);
      return NextResponse.json(
        { error: 'Error al crear la reserva' },
        { status: 500 }
      );
    }

    const bookingId = booking[0].id;

    const successParams = new URLSearchParams({
      session_id: '{CHECKOUT_SESSION_ID}',
      customer_name,
      customer_email,
      customer_phone: customer_phone || '',
      class_title: class_title || '',
      instructor_name: instructor_name || '',
      day: day || '',
      hour: hour || '',
      bike_number: String(bike_number),
      bike_row: String(bike_row),
      amount: String(amount_cents / 100),
    });

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email,
      line_items: [
        {
          price_data: {
            currency: currency?.toLowerCase() || 'mxn',
            product_data: {
              name: class_title || 'Clase Rideon',
              description: `👤 ${instructor_name || 'Por definir'} • 📅 ${date_time} • 🚴 Bici #${String(bike_number).padStart(2, '0')} Fila ${bike_row} • ⏱ ${duration || '45 min'} • 🎁 Bebida cortesía`,
              metadata: {
                customer_name,
                customer_phone: customer_phone || '',
                bike_number: String(bike_number),
                bike_row: String(bike_row),
                class_title,
                instructor_name,
                date_time,
                day,
                hour,
              },
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: bookingId,
        customer_name,
        customer_email,
        customer_phone: customer_phone || '',
        bike_number: String(bike_number),
        bike_row: String(bike_row),
        class_title,
        instructor_name,
        date_time,
        class_date: class_date || '',
        day,
        hour,
      },
      success_url: `${baseUrl}/reserva-exitosa?${successParams}`,
      cancel_url: baseUrl,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (err: unknown) {
    console.error('[checkout] Error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Error interno al crear la sesión de pago',
      },
      { status: 500 }
    );
  }
}
