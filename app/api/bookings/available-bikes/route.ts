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
    const classDate = searchParams.get('class_date'); // 'YYYY-MM-DD' (preferido)

    // Se requiere hora + (fecha exacta O día de la semana como respaldo).
    if (!classTitle || !hour || (!classDate && !day)) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: class_title, hour y class_date (o day)' },
        { status: 400 }
      );
    }

    if (classTitle.length > 200 || (day && day.length > 20) || hour.length > 20 ||
        (classDate && !/^\d{4}-\d{2}-\d{2}$/.test(classDate))) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const pendingCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Expira reservas 'pending' abandonadas (>10 min): libera el índice único
    // y limpia el panel admin. No bloquea si falla.
    await supabase
      .from('bookings')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', pendingCutoff);

    // Filtra por la FECHA exacta (class_date) cuando se provee; así las reservas
    // de un jueves no bloquean otro jueves distinto. Si no hay fecha, cae al
    // día de la semana (compat).
    let query = supabase
      .from('bookings')
      .select('bike_number')
      .eq('class_title', classTitle)
      .eq('hour', hour);
    query = classDate ? query.eq('class_date', classDate) : query.eq('day', day as string);

    const { data, error } = await query
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
