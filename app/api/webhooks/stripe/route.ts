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

    // ── Pago de cuota de mantenimiento ────────────────────────────────
    // Suma el monto pagado a maintenance_paid_cents (idempotente por session).
    if (metadata.kind === 'maintenance') {
      const membershipId = metadata.membership_id;
      const paidNow = session.amount_total || 0;
      if (!membershipId) {
        console.error('[webhook] maintenance sin membership_id');
        return NextResponse.json({ received: true });
      }
      const { data: mem } = await supabase
        .from('memberships')
        .select('id, maintenance_paid_cents, maintenance_last_session_id')
        .eq('id', membershipId)
        .maybeSingle();
      if (!mem) {
        console.error('[webhook] maintenance: membresía no encontrada', membershipId);
        return NextResponse.json({ received: true });
      }
      if (mem.maintenance_last_session_id === session.id) {
        console.log('[webhook] maintenance ya aplicada, skip', session.id);
        return NextResponse.json({ received: true });
      }
      const newPaid = Math.min(25000, (mem.maintenance_paid_cents || 0) + paidNow);
      const { error: updErr } = await supabase
        .from('memberships')
        .update({
          maintenance_paid_cents: newPaid,
          maintenance_last_session_id: session.id,
          ...(metadata.semester_start ? { maintenance_semester_start: metadata.semester_start } : {}),
        })
        .eq('id', membershipId);
      if (updErr) {
        console.error('[webhook] maintenance update error:', updErr);
        return NextResponse.json({ error: 'Failed to record maintenance payment' }, { status: 500 });
      }
      console.log(`[webhook] Cuota mantenimiento +${paidNow}c → ${newPaid}c para membresía ${membershipId}`);
      return NextResponse.json({ received: true });
    }

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
        // Devolver 500 para que Stripe reintente el webhook (evita membresías
        // pagadas que nunca se registran por un fallo transitorio de BD).
        return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
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

  // ── Renovación mensual de suscripción ──────────────────────────────
  // invoice.paid con billing_reason 'subscription_cycle' = cobro recurrente.
  // Extiende la membresía activa +30 días. (La cuota de mantenimiento se
  // cobrará por otro mecanismo semanal, no aquí — ver project memory.)
  else if (event.type === 'invoice.paid') {
    const invoice = event.data.object as import('stripe').Stripe.Invoice & { subscription?: string };
    const reason = invoice.billing_reason;
    if (reason === 'subscription_cycle') {
      const supabase = createAdminClient();
      const emailLc = (invoice.customer_email || '').toLowerCase();

      // Renovación (no el primer recibo, ese lo maneja checkout.session.completed):
      // extiende la membresía activa de suscripción de ese correo +30 días.
      if (emailLc) {
        const { data: mem } = await supabase
          .from('memberships')
          .select('id')
          .eq('customer_email', emailLc)
          .eq('type', 'subscription')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mem) {
          await supabase
            .from('memberships')
            .update({
              status: 'active',
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', mem.id);
          console.log(`[webhook] Suscripción renovada +30d para ${emailLc}`);
        } else {
          console.warn(`[webhook] Renovación sin membresía encontrada para ${emailLc}`);
        }
      }
    }
  }

  // ── Cancelación de suscripción ─────────────────────────────────────
  else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as import('stripe').Stripe.Subscription;
    const customerId = typeof sub.customer === 'string' ? sub.customer : undefined;
    if (customerId) {
      try {
        const cust = await getStripe().customers.retrieve(customerId);
        const emailLc = (!('deleted' in cust) ? cust.email : '')?.toLowerCase() || '';
        if (emailLc) {
          const supabase = createAdminClient();
          await supabase
            .from('memberships')
            .update({ status: 'cancelled' })
            .eq('customer_email', emailLc)
            .eq('type', 'subscription')
            .eq('status', 'active');
          console.log(`[webhook] Suscripción cancelada para ${emailLc}`);
        }
      } catch (e) {
        console.error('[webhook] Error cancelación suscripción:', e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
