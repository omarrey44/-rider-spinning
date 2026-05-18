import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email, confirmation } = await req.json();

    const supabase = createAdminClient();
    let data;
    let error;

    if (confirmation) {
      // Buscar por número de confirmación
      if (!/^[0-9A-F]{8}$/i.test(confirmation.trim())) {
        return NextResponse.json(
          { error: 'Número de confirmación inválido (8 caracteres)' },
          { status: 400 }
        );
      }

      const { data: results, error: err } = await supabase
        .from('bookings')
        .select(
          'id, customer_name, bike_number, bike_row, class_title, instructor_name, day, hour, class_date, status, created_at'
        )
        .eq('confirmation_number', confirmation.trim().toUpperCase())
        .order('created_at', { ascending: false })
        .limit(10);

      data = results;
      error = err;
    } else if (email) {
      // Buscar por correo
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Ingresa un correo electrónico válido' },
          { status: 400 }
        );
      }

      const { data: results, error: err } = await supabase
        .from('bookings')
        .select(
          'id, customer_name, bike_number, bike_row, class_title, instructor_name, day, hour, class_date, status, created_at'
        )
        .eq('customer_email', email.trim().toLowerCase())
        .order('created_at', { ascending: false })
        .limit(10);

      data = results;
      error = err;
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

    return NextResponse.json({ bookings: data || [] });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
