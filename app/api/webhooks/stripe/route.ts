import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendBookingConfirmation, sendPackConfirmation, sendSubscriptionConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No Stripe signature found' }, { status: 400 });
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
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata;

    if (!metadata) {
      console.error('[webhook] Missing metadata');
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();
    const email = session.customer_details?.email || metadata.customer_email || '';
    const amount = (session.amount_total || 0) / 100;
    const confirmationNumber = metadata.confirmation_number || metadata.booking_id?.substring(0, 8).toUpperCase() || '';
    const isClassBooking = !metadata.pack_size && !metadata.subscription_type;

    if (isClassBooking) {
      // ── Class booking: update bookings table ──────────────────────
      if (!metadata.booking_id) {
        console.error('[webhook] Missing booking_id for class booking');
        return NextResponse.json({ received: true });
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          stripe_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
          amount_paid: session.amount_total,
          confirmation_number: confirmationNumber,
        })
        .eq('id', metadata.booking_id);

      if (updateError) {
        console.error('[webhook] Supabase update error:', updateError);
        return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 });
      }

      console.log(`[webhook] Class booking confirmed: ${metadata.booking_id} - ${metadata.customer_name} - Bici #${metadata.bike_number}`);

      await sendBookingConfirmation({
        customerName: metadata.customer_name,
        customerEmail: email,
        classTitle: metadata.class_title,
        instructorName: metadata.instructor_name,
        day: metadata.day,
        hour: metadata.hour,
        classDate: metadata.class_date || null,
        bikeNumber: parseInt(metadata.bike_number, 10),
        bikeRow: parseInt(metadata.bike_row, 10),
        amount,
        confirmationNumber,
        goal: metadata.goal || undefined,
      });

    } else {
      // ── Pack / subscription: create membership ────────────────────
      const isSub = !!metadata.subscription_type;

      // Idempotency: skip if already processed
      const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .eq('stripe_session_id', session.id)
        .limit(1)
        .single();
      if (existing) {
        console.log(`[webhook] Already processed session ${session.id}, skipping`);
        return NextResponse.json({ received: true });
      }

      const { error: memError } = await supabase.from('memberships').insert({
        customer_name: metadata.customer_name,
        customer_email: email,
        customer_phone: metadata.customer_phone || null,
        type: isSub ? 'subscription' : 'pack',
        credits_total: isSub ? null : parseInt(metadata.pack_size, 10),
        credits_used: 0,
        expires_at: new Date(Date.now() + (isSub ? 30 : 7) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        confirmation_number: confirmationNumber,
        stripe_session_id: session.id,
        amount_paid: session.amount_total,
        goal: metadata.goal || null,
      });

      if (memError) {
        console.error('[webhook] Membership insert error:', memError);
      }

      console.log(`[webhook] ${isSub ? 'Subscription' : 'Pack'} confirmed: ${confirmationNumber} - ${metadata.customer_name}`);

      if (isSub) {
        await sendSubscriptionConfirmation({
          customerName: metadata.customer_name,
          customerEmail: email,
          amount,
          confirmationNumber,
          goal: metadata.goal || undefined,
        });
      } else {
        await sendPackConfirmation({
          customerName: metadata.customer_name,
          customerEmail: email,
          amount,
          confirmationNumber,
          goal: metadata.goal || undefined,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
