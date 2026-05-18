import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBookingConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'No Stripe signature found' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const stripe = getStripe();
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    console.error('[webhook] Invalid signature:', err);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata;

    if (!metadata?.booking_id) {
      console.error('[webhook] Missing booking_id in metadata');
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();
    const confirmationNumber = metadata.booking_id.substring(0, 8).toUpperCase();

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null,
        amount_paid: session.amount_total,
        confirmation_number: confirmationNumber,
      })
      .eq('id', metadata.booking_id);

    if (updateError) {
      console.error('[webhook] Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm booking' },
        { status: 500 }
      );
    }

    console.log(
      `[webhook] Booking confirmed: ${metadata.booking_id} - ${metadata.customer_name} - Bici #${metadata.bike_number}`
    );

    await sendBookingConfirmation({
      customerName: metadata.customer_name,
      customerEmail: session.customer_details?.email || metadata.customer_email || '',
      classTitle: metadata.class_title,
      instructorName: metadata.instructor_name,
      day: metadata.day,
      hour: metadata.hour,
      classDate: metadata.class_date || null,
      bikeNumber: parseInt(metadata.bike_number, 10),
      bikeRow: parseInt(metadata.bike_row, 10),
      amount: (session.amount_total || 0) / 100,
      confirmationNumber,
      goal: metadata.goal || undefined,
    });
  }

  return NextResponse.json({ received: true });
}
