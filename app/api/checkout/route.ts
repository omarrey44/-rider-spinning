import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

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
      day,
      hour,
      amount_cents,
      currency,
    } = body;

    if (!customer_name || !customer_email || !bike_number || !day || !hour) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: nombre, correo, bicicleta, día y hora' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe no está configurado. Define STRIPE_SECRET_KEY' },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email,
      line_items: [
        {
          price_data: {
            currency: currency?.toLowerCase() || 'mxn',
            product_data: {
              name: `Rideon - ${class_title}`,
              description: `Bici #${String(bike_number).padStart(2, '0')} · Fila ${bike_row} · ${date_time}`,
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
        customer_name,
        customer_email,
        customer_phone: customer_phone || '',
        bike_number: String(bike_number),
        bike_row: String(bike_row),
        class_title,
        instructor_name,
        date_time,
        day,
        hour,
      },
      success_url: `${baseUrl}/reserva-exitosa?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#reservar`,
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
