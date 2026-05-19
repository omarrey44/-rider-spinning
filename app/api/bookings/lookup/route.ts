import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email, confirmation } = await req.json();

    const supabase = createAdminClient();
    let data;
    let error;

    let memberships: unknown[] = [];

    if (confirmation) {
      if (!/^[0-9A-F]{8}$/i.test(confirmation.trim())) {
        return NextResponse.json(
          { error: 'Número de confirmación inválido (8 caracteres)' },
          { status: 400 }
        );
      }
      const code = confirmation.trim().toUpperCase();

      const [bookingRes, membershipRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, customer_name, bike_number, bike_row, class_title, instructor_name, day, hour, class_date, status, created_at')
          .eq('confirmation_number', code)
          .gt('bike_number', 0)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('memberships')
          .select('id, customer_name, customer_email, type, credits_total, credits_used, expires_at, status, confirmation_number, created_at')
          .eq('confirmation_number', code)
          .limit(5),
      ]);

      data = bookingRes.data;
      error = bookingRes.error;
      memberships = membershipRes.data || [];
    } else if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Ingresa un correo electrónico válido' },
          { status: 400 }
        );
      }
      const emailLower = email.trim().toLowerCase();

      const [bookingRes, membershipRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, customer_name, bike_number, bike_row, class_title, instructor_name, day, hour, class_date, status, created_at')
          .eq('customer_email', emailLower)
          .gt('bike_number', 0)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('memberships')
          .select('id, customer_name, customer_email, type, credits_total, credits_used, expires_at, status, confirmation_number, created_at')
          .eq('customer_email', emailLower)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      data = bookingRes.data;
      error = bookingRes.error;
      memberships = membershipRes.data || [];
    } else {
      return NextResponse.json(
        { error: 'Ingresa un correo o número de confirmación' },
        { status: 400 }
      );
    }

    if (error) {
      console.error('[lookup] Supabase query error:', error);
      return NextResponse.json(
        { error: 'Error al buscar reservas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: data || [], memberships });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
