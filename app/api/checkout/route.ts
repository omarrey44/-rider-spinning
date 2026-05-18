import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBookingConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  let bookingId: string | null = null;
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
      test_mode,
      goal,
    } = body;

    if (!customer_name || !customer_email || !bike_number || !day || !hour) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: nombre, correo, bicicleta, día y hora' },
        { status: 400 }
      );
    }

    // Validate amount_cents is a positive integer
    if (
      !Number.isInteger(amount_cents) ||
      amount_cents <= 0
    ) {
      return NextResponse.json(
        { error: 'Monto inválido' },
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
        goal: goal || null,
      })
      .select();

    if (bookingError || !booking || booking.length === 0) {
      console.error('[checkout] Supabase insert error:', bookingError);
      if (bookingError?.code === '23505') {
        return NextResponse.json(
          { error: 'Esta bici ya fue reservada. Selecciona otra.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Error al crear la reserva' },
        { status: 500 }
      );
    }

    bookingId = booking[0].id;
    const confirmationNumber = bookingId!.substring(0, 8).toUpperCase();

    // Test mode: skip Stripe — only allowed outside production
    if (test_mode === true && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (test_mode === true) {
      // Update booking status to confirmed in test mode
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmation_number: confirmationNumber,
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('[checkout] Test mode update error:', updateError);
        return NextResponse.json(
          { error: 'Error al confirmar reserva en modo test' },
          { status: 500 }
        );
      }

      // Send confirmation email in test mode
      await sendBookingConfirmation({
        customerName: customer_name,
        customerEmail: customer_email,
        classTitle: class_title,
        instructorName: instructor_name,
        day,
        hour,
        classDate: class_date || null,
        bikeNumber: bike_number,
        bikeRow: bike_row,
        amount: amount_cents / 100,
        confirmationNumber,
        goal: goal || undefined,
      });

      console.log(`[checkout] Test mode booking confirmed: ${bookingId}`);
      return NextResponse.json({ test_mode: true, booking_id: bookingId });
    }

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
                goal: goal || '',
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
        goal: goal || '',
      },
      success_url: `${baseUrl}/reserva-exitosa?${successParams}`,
      cancel_url: baseUrl,
    });

    return NextResponse.json({ checkout_url: session.url });
  } catch (err: unknown) {
    console.error('[checkout] Error:', err);
    // Clean up orphaned pending booking if Stripe session creation failed
    if (bookingId) {
      const supabase = createAdminClient();
      await supabase.from('bookings').delete().eq('id', bookingId);
      console.log(`[checkout] Rolled back orphaned booking: ${bookingId}`);
    }
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
