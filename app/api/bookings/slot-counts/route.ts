import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`slot-counts:${ip}`, 60, 60_000)) {
    return NextResponse.json({ counts: {} });
  }
  try {
    const supabase = createAdminClient();

    const pendingCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Expira reservas 'pending' abandonadas (>10 min) para liberar el lugar y el índice.
    await supabase
      .from('bookings')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', pendingCutoff);

    const { data, error } = await supabase
      .from('bookings')
      .select('class_title, class_date, day, hour')
      .or(`status.eq.confirmed,and(status.eq.pending,created_at.gte.${pendingCutoff})`);

    if (error) {
      return NextResponse.json({ counts: {} });
    }

    // Se llavea por FECHA real (class_date), no por día de la semana: así las
    // reservas de un jueves no cuentan para otro jueves distinto. Fallback a
    // `day` solo para filas antiguas sin class_date.
    const counts: Record<string, number> = {};
    for (const row of data || []) {
      const dateKey = row.class_date || row.day;
      const key = `${row.class_title}|${dateKey}|${row.hour}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}
