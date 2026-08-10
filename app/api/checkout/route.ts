import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBookingConfirmation, sendPackConfirmation, sendSubscriptionConfirmation } from '@/lib/email';
import { BIKE_CONFIG } from '@/data/schedule';
import { randomUUID } from 'crypto';

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
      currency,
      test_mode,
      goal,
      pack_size,
      subscription_type,
    } = body;

    // Server-side price catalog — never trust client amount_cents
    const PRICES = {
      class: 20000,       // $200 MXN
      pack3: 30000,       // $300 MXN
      subscription: 65000, // $650 MXN/mes
    } as const;

    const ALLOWED_PACK_SIZES = [3] as const;
    const ALLOWED_SUBSCRIPTION_TYPES = ['monthly'] as const;

    const isClassBooking = !pack_size && !subscription_type;

    if (!customer_name || !customer_email) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: nombre y correo' },
        { status: 400 }
      );
    }

    if (isClassBooking && (!bike_number || !day || !hour)) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: bicicleta, día y hora' },
        { status: 400 }
      );
    }

    if (isClassBooking && BIKE_CONFIG.maintenance.includes(Number(bike_number))) {
      return NextResponse.json(
        { error: 'Esa bici está en mantenimiento. Elige otra.' },
        { status: 400 }
      );
    }

    // Validate pack_size and subscription_type against whitelist
    if (pack_size !== undefined && !ALLOWED_PACK_SIZES.includes(pack_size)) {
      return NextResponse.json({ error: 'Pack inválido' }, { status: 400 });
    }
    if (subscription_type !== undefined && subscription_type !== null && !ALLOWED_SUBSCRIPTION_TYPES.includes(subscription_type)) {
      return NextResponse.json({ error: 'Tipo de suscripción inválido' }, { status: 400 });
    }

    // Override amount_cents with server-side price — client value ignored
    const serverAmountCents = isClassBooking
      ? PRICES.class
      : pack_size
        ? PRICES.pack3
        : PRICES.subscription;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe no está configurado. Define STRIPE_SECRET_KEY' },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();

    // Cleanup expired pending bookings (older than 10 min) for this email
    if (isClassBooking && customer_email) {
      const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await supabase
        .from('bookings')
        .delete()
        .eq('customer_email', customer_email.toLowerCase())
        .eq('status', 'pending')
        .lt('created_at', cutoff);
    }

    // Test mode: skip Stripe — only allowed outside production
    if (test_mode === true && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (test_mode === true) {
      // ── TEST MODE ─────────────────────────────────────────────────
      if (isClassBooking) {
        // Class booking: insert into bookings
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
            amount_paid: serverAmountCents,
            status: 'confirmed',
            goal: goal || null,
          })
          .select()
          .single();

        if (bookingError || !booking) {
          if (bookingError?.code === '23505') {
            return NextResponse.json({ error: 'Esta bici ya fue reservada. Selecciona otra.' }, { status: 409 });
          }
          console.error('[checkout] Test booking insert error:', bookingError);
          return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 });
        }

        const confirmationNumber = booking.id.substring(0, 8).toUpperCase();
        await supabase.from('bookings').update({ confirmation_number: confirmationNumber }).eq('id', booking.id);

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
          amount: serverAmountCents / 100,
          confirmationNumber,
          goal: goal || undefined,
        });

        console.log(`[checkout] Test mode class booking confirmed: ${booking.id}`);
        return NextResponse.json({ test_mode: true, booking_id: booking.id });

      } else {
        // Pack/subscription: insert into memberships only
        const confirmationNumber = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();

        await supabase.from('memberships').insert({
          customer_name,
          customer_email,
          customer_phone: customer_phone || null,
          type: subscription_type ? 'subscription' : 'pack',
          credits_total: subscription_type ? null : pack_size,
          credits_used: 0,
          expires_at: new Date(
            Date.now() + (subscription_type ? 30 : 7) * 24 * 60 * 60 * 1000
          ).toISOString(),
          status: 'active',
          confirmation_number: confirmationNumber,
          amount_paid: serverAmountCents,
          goal: goal || null,
        });

        if (subscription_type) {
          await sendSubscriptionConfirmation({
            customerName: customer_name,
            customerEmail: customer_email,
            amount: serverAmountCents / 100,
            confirmationNumber,
            goal: goal || undefined,
          });
        } else {
          await sendPackConfirmation({
            customerName: customer_name,
            customerEmail: customer_email,
            amount: serverAmountCents / 100,
            confirmationNumber,
            goal: goal || undefined,
          });
        }

        console.log(`[checkout] Test mode ${subscription_type ? 'subscription' : 'pack'} confirmed: ${confirmationNumber}`);
        return NextResponse.json({ test_mode: true, confirmation_number: confirmationNumber });
      }
    }

    // ── STRIPE FLOW ──────────────────────────────────────────────────
    let confirmationNumber: string;

    if (isClassBooking) {
      // Insert pending booking to reserve the slot
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
          amount_paid: serverAmountCents,
          status: 'pending',
          goal: goal || null,
        })
        .select();

      if (bookingError || !booking || booking.length === 0) {
        console.error('[checkout] Supabase insert error:', bookingError);
        if (bookingError?.code === '23505') {
          return NextResponse.json({ error: 'Esta bici ya fue reservada. Selecciona otra.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 });
      }

      bookingId = booking[0].id;
      confirmationNumber = booking[0].id.substring(0, 8).toUpperCase();
    } else {
      // Pack/subscription: no booking record needed
      confirmationNumber = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
    }

    const successParams = new URLSearchParams({
      customer_name,
      class_title: class_title || '',
      instructor_name: instructor_name || '',
      day: day || '',
      hour: hour || '',
      bike_number: String(bike_number || 0),
      bike_row: String(bike_row || 0),
      amount: String(serverAmountCents / 100),
    });

    const productDescription = isClassBooking
      ? `👤 ${instructor_name || 'Por definir'} • 📅 ${date_time} • 🚴 Bici #${String(bike_number).padStart(2, '0')} Fila ${bike_row} • ⏱ ${duration || '45 min'} • 🎁 Bebida cortesía`
      : pack_size
        ? `Pack ${pack_size} horas · válido 7 días · Cancela hasta 1h antes`
        : 'Clases ilimitadas · Botella + toalla · Cancela cuando quieras';

    const sharedMetadata = {
      booking_id: bookingId || '',
      confirmation_number: confirmationNumber,
      customer_name,
      customer_email,
      customer_phone: customer_phone || '',
      bike_number: String(bike_number || 0),
      bike_row: String(bike_row || 0),
      class_title: class_title || '',
      instructor_name: instructor_name || '',
      date_time: date_time || '',
      class_date: class_date || '',
      day: day || '',
      hour: hour || '',
      goal: goal || '',
      pack_size: pack_size ? String(pack_size) : '',
      subscription_type: subscription_type || '',
    };

    let session;
    if (subscription_type) {
      // ── SUSCRIPCIÓN RECURRENTE ──────────────────────────────────────
      // Cobro automático mensual (sin inscripción este mes).
      const monthlyPrice = process.env.STRIPE_PRICE_MONTHLY;
      if (!monthlyPrice) {
        return NextResponse.json(
          { error: 'Suscripción no configurada: falta STRIPE_PRICE_MONTHLY' },
          { status: 500 }
        );
      }
      session = await getStripe().checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email,
        line_items: [
          { price: monthlyPrice, quantity: 1 },       // recurrente $650/mes
        ],
        subscription_data: { metadata: sharedMetadata },
        metadata: sharedMetadata,
        success_url: `${baseUrl}/reserva-exitosa?session_id={CHECKOUT_SESSION_ID}&${successParams}`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
      });
    } else {
      // ── PAGO ÚNICO (clase / pack) ───────────────────────────────────
      session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email,
        line_items: [
          {
            price_data: {
              currency: currency?.toLowerCase() || 'mxn',
              product_data: {
                name: class_title || 'Clase Rideon',
                description: productDescription,
                metadata: {
                  customer_name,
                  customer_phone: customer_phone || '',
                  bike_number: String(bike_number || 0),
                  bike_row: String(bike_row || 0),
                  class_title: class_title || '',
                  instructor_name: instructor_name || '',
                  date_time: date_time || '',
                  day: day || '',
                  hour: hour || '',
                  goal: goal || '',
                },
              },
              unit_amount: serverAmountCents,
            },
            quantity: 1,
          },
        ],
        metadata: sharedMetadata,
        success_url: `${baseUrl}/reserva-exitosa?session_id={CHECKOUT_SESSION_ID}&${successParams}`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
      });
    }

    return NextResponse.json({ checkout_url: session.url });
  } catch (err: unknown) {
    console.error('[checkout] Error:', err);
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
