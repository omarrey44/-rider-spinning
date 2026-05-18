import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classTitle = searchParams.get('class_title');
    const day = searchParams.get('day');
    const hour = searchParams.get('hour');

    if (!classTitle || !day || !hour) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: class_title, day, hour' },
        { status: 400 }
      );
    }

    if (classTitle.length > 200 || day.length > 20 || hour.length > 20) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('bookings')
      .select('bike_number')
      .eq('class_title', classTitle)
      .eq('day', day)
      .eq('hour', hour)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('[available-bikes] Supabase error:', error);
      return NextResponse.json(
        { error: 'Error al obtener bicis' },
        { status: 500 }
      );
    }

    const takenBikes = (data || []).map((b) => b.bike_number);

    return NextResponse.json({ takenBikes });
  } catch (err: unknown) {
    console.error('[available-bikes] Error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
