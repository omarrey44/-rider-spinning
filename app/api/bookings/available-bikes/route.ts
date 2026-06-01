import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`available-bikes:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 });
  }

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

    const pendingCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .select('bike_number')
      .eq('class_title', classTitle)
      .eq('day', day)
      .eq('hour', hour)
      .or(`status.eq.confirmed,and(status.eq.pending,created_at.gte.${pendingCutoff})`);

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
