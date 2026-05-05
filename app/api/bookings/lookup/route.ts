import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Ingresa un correo electrónico válido' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('bookings')
      .select(
        'id, customer_name, bike_number, bike_row, class_title, instructor_name, day, hour, status, created_at'
      )
      .eq('customer_email', email.trim().toLowerCase())
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[lookup] Supabase query error:', error);
      return NextResponse.json(
        { error: 'Error al buscar reservas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: data || [] });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
