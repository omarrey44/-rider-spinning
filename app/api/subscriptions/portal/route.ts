import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Crea una sesión del Stripe Billing Portal para que el cliente administre
// (o cancele) su suscripción con su propia tarjeta.
//
// Seguridad: como es un endpoint público, exigimos correo + número de
// confirmación y verificamos que exista una membresía de suscripción con
// ambos datos antes de emitir el link del portal (evita enumerar clientes).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`sub-portal:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un minuto.' }, { status: 429 });
  }

  try {
    const { customer_email, confirmation_number } = await req.json();

    if (!customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
    }
    if (!confirmation_number || !/^[0-9A-F]{8}$/i.test(String(confirmation_number).trim())) {
      return NextResponse.json({ error: 'Número de confirmación inválido' }, { status: 400 });
    }

    const emailLc = String(customer_email).trim().toLowerCase();
    const code = String(confirmation_number).trim().toUpperCase();

    // Verifica que exista una suscripción con ese correo + código.
    const supabase = createAdminClient();
    const { data: mem } = await supabase
      .from('memberships')
      .select('id, type')
      .eq('customer_email', emailLc)
      .eq('confirmation_number', code)
      .eq('type', 'subscription')
      .limit(1)
      .maybeSingle();

    if (!mem) {
      return NextResponse.json(
        { error: 'No encontramos una suscripción con esos datos.' },
        { status: 404 }
      );
    }

    // Localiza el cliente en Stripe por correo.
    const stripe = getStripe();
    const customers = await stripe.customers.list({ email: emailLc, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
      return NextResponse.json(
        { error: 'No encontramos tu suscripción en el sistema de pagos. Contáctanos por WhatsApp.' },
        { status: 404 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get('origin') ||
      'https://www.rideonspinningstudio.com.mx';

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${baseUrl}/#mis-reservas`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[subscriptions/portal]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
