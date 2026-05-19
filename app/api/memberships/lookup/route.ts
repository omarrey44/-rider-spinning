import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const code = searchParams.get('code');

    if (!email && !code) {
      return NextResponse.json({ error: 'email o code requerido' }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    if (code && !/^[0-9A-F]{8}$/i.test(code)) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let query = supabase
      .from('memberships')
      .select('id, customer_name, customer_email, type, credits_total, credits_used, expires_at, status, confirmation_number, goal, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (email) {
      query = query.eq('customer_email', email.toLowerCase());
    } else {
      query = query.eq('confirmation_number', code!.toUpperCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[memberships/lookup]', error);
      return NextResponse.json({ error: 'Error al buscar membresía' }, { status: 500 });
    }

    return NextResponse.json({ memberships: data || [] });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
