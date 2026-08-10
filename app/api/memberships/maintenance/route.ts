import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { computeMaintenance } from '@/lib/maintenance';

// Verifica y devuelve la membresía de suscripción por correo + código.
async function findSubscription(emailLc: string, code: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('memberships')
    .select('id, customer_name, customer_email, type, status, created_at, maintenance_semester_start, maintenance_paid_cents, maintenance_exempt')
    .eq('customer_email', emailLc)
    .eq('confirmation_number', code)
    .eq('type', 'subscription')
    .limit(1)
    .maybeSingle();
  return { supabase, membership: data };
}

function validate(email: unknown, code: unknown): { emailLc: string; code: string } | null {
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (!code || typeof code !== 'string' || !/^[0-9A-F]{8}$/i.test(code.trim())) return null;
  return { emailLc: email.trim().toLowerCase(), code: code.trim().toUpperCase() };
}

// GET ?email=&confirmation=  →  estado de la cuota de mantenimiento.
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`maint-status:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }
  const url = new URL(req.url);
  const v = validate(url.searchParams.get('email'), url.searchParams.get('confirmation'));
  if (!v) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { supabase, membership } = await findSubscription(v.emailLc, v.code);
  if (!membership) return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });

  const state = computeMaintenance(
    membership.type,
    membership.created_at,
    membership.maintenance_semester_start,
    membership.maintenance_paid_cents,
    new Date(),
    membership.maintenance_exempt ?? false,
  );

  // Reset perezoso: si empezó un nuevo semestre, persistimos el nuevo inicio y
  // reiniciamos lo pagado.
  if (state.needsSemesterReset) {
    await supabase
      .from('memberships')
      .update({
        maintenance_semester_start: state.semesterStartISO,
        maintenance_paid_cents: 0,
        maintenance_last_reminder_week: 0,
      })
      .eq('id', membership.id);
  }

  return NextResponse.json({ state });
}

// POST { customer_email, confirmation_number }  →  crea checkout de Stripe por lo adeudado.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`maint-pay:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un minuto.' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const v = validate(body.customer_email, body.confirmation_number);
    if (!v) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { membership } = await findSubscription(v.emailLc, v.code);
    if (!membership) return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });

    const state = computeMaintenance(
      membership.type,
      membership.created_at,
      membership.maintenance_semester_start,
      membership.maintenance_paid_cents,
      new Date(),
      membership.maintenance_exempt ?? false,
    );

    if (state.owedCents <= 0) {
      return NextResponse.json({ error: 'No tienes cuota pendiente por pagar.' }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get('origin') ||
      'https://www.rideonspinningstudio.com.mx';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: v.emailLc,
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Cuota de mantenimiento',
              description: 'Cuota de mantenimiento de tu membresía (semestral, cobro semanal)',
            },
            unit_amount: state.owedCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: 'maintenance',
        membership_id: membership.id,
        semester_start: state.semesterStartISO,
        amount_cents: String(state.owedCents),
      },
      success_url: `${baseUrl}/#mis-reservas`,
      cancel_url: `${baseUrl}/#mis-reservas`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[memberships/maintenance POST]', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
