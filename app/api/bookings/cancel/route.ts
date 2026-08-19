import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import { sendCancellationConfirmation } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { booking_id, customer_email, customer_phone } = await req.json();

    if (!booking_id || (!customer_email && !customer_phone)) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch booking and verify ownership
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_email, customer_phone, status, class_date, class_title, instructor_name, hour, day, confirmation_number, amount_paid, stripe_payment_intent_id, membership_id')
      .eq('id', booking_id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Verificación de propiedad: por correo O por teléfono (últimos 10 dígitos).
    const emailOk = !!customer_email &&
      booking.customer_email?.toLowerCase() === customer_email.toLowerCase();
    const phoneOk = !!customer_phone && !!booking.customer_phone &&
      booking.customer_phone.replace(/\D/g, '').slice(-10) === String(customer_phone).replace(/\D/g, '').slice(-10) &&
      String(customer_phone).replace(/\D/g, '').length >= 10;
    if (!emailOk && !phoneOk) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Correo real en archivo (para reembolso de créditos y correo de cancelación).
    const ownerEmail = (booking.customer_email || '').toLowerCase();

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'La reserva ya está cancelada' }, { status: 400 });
    }

    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      return NextResponse.json({ error: 'Esta reserva no se puede cancelar' }, { status: 400 });
    }

    // Ventana de cancelación + elegibilidad de reembolso.
    // >4h antes → reembolso completo automático · 1–4h → cancela sin reembolso · <1h → no cancelable.
    let hoursUntilClass = Infinity;
    if (booking.class_date && booking.hour) {
      const [hourStr, rest] = booking.hour.split(':');
      const minuteAndPeriod = rest?.split(' ') || [];
      let h = parseInt(hourStr, 10);
      const m = parseInt(minuteAndPeriod[0] || '0', 10);
      const period = minuteAndPeriod[1] || '';
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      const classTime = new Date(`${booking.class_date}T00:00:00`);
      classTime.setHours(h, m, 0, 0);
      hoursUntilClass = (classTime.getTime() - Date.now()) / (60 * 60 * 1000);
      if (hoursUntilClass < 1) {
        return NextResponse.json({
          error: 'No es posible cancelar con menos de 1 hora de anticipación.',
        }, { status: 400 });
      }
    }
    // Reembolso completo solo si canceló con más de 4h y fue un pago real (clase suelta).
    const eligibleForRefund =
      hoursUntilClass > 4 &&
      typeof booking.amount_paid === 'number' &&
      booking.amount_paid > 0 &&
      !!booking.stripe_payment_intent_id;

    // Cancel booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking_id);

    if (updateError) {
      console.error('[bookings/cancel] update error:', updateError);
      return NextResponse.json({ error: 'Error al cancelar' }, { status: 500 });
    }

    // Reembolso automático en Stripe (>4h, pago real). No bloquea la cancelación si falla.
    let refunded = false;
    if (eligibleForRefund) {
      try {
        await getStripe().refunds.create({
          payment_intent: booking.stripe_payment_intent_id as string,
          reason: 'requested_by_customer',
        });
        refunded = true;
        console.log(`[bookings/cancel] Stripe refund emitido para ${booking_id} ($${(booking.amount_paid ?? 0) / 100})`);
      } catch (e) {
        console.error('[bookings/cancel] Error al reembolsar en Stripe (cancelación sí aplicada):', e);
      }
    }

    // Restituir crédito SOLO si la reserva se hizo con un PACK (identificado por
    // membership_id). Las reservas de mensualidad también tienen amount_paid = 0,
    // así que sin este vínculo se regalaría un crédito que no se gastó.
    if (booking.membership_id) {
      const { data: mem } = await supabase
        .from('memberships')
        .select('id, type, credits_used')
        .eq('id', booking.membership_id)
        .maybeSingle();
      if (mem && mem.type === 'pack' && mem.credits_used > 0) {
        await supabase
          .from('memberships')
          .update({ credits_used: mem.credits_used - 1 })
          .eq('id', mem.id);
        console.log(`[bookings/cancel] Refunded 1 credit to pack ${mem.id}`);
      }
    }

    if (ownerEmail) {
      await sendCancellationConfirmation({
        customerName: booking.customer_name,
        customerEmail: ownerEmail,
        classTitle: booking.class_title,
        instructorName: booking.instructor_name,
        day: booking.day,
        hour: booking.hour,
        confirmationNumber: booking.confirmation_number || booking_id.substring(0, 8).toUpperCase(),
        refunded,
        refundAmount: refunded ? (booking.amount_paid ?? 0) / 100 : undefined,
      });
    }

    console.log(`[bookings/cancel] Cancelled booking ${booking_id} (${ownerEmail || 'via phone'})${refunded ? ' + refund' : ''}`);
    return NextResponse.json({ success: true, refunded });
  } catch (err) {
    console.error('[bookings/cancel]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
