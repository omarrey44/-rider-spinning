import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json(
      { error: 'No Stripe signature found' },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
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

    if (!metadata?.customer_name || !metadata?.bike_number) {
      console.error('[webhook] Missing metadata for booking insertion');
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from('bookings').insert({
      customer_name: metadata.customer_name,
      customer_email: session.customer_details?.email || metadata.customer_email || '',
      customer_phone: metadata.customer_phone || null,
      bike_number: parseInt(metadata.bike_number, 10),
      bike_row: parseInt(metadata.bike_row, 10),
      class_title: metadata.class_title,
      instructor_name: metadata.instructor_name,
      day: metadata.day,
      hour: metadata.hour,
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : null,
      amount_paid: session.amount_total,
      status: 'confirmed',
    });

    if (error) {
      console.error('[webhook] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to insert booking' },
        { status: 500 }
      );
    }

    console.log(
      `[webhook] Booking confirmed for ${metadata.customer_name} - Bici #${metadata.bike_number}`
    );
  }

  return NextResponse.json({ received: true });
}
