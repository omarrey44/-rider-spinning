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

    const pendingCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .select('class_title, day, hour')
      .or(`status.eq.confirmed,and(status.eq.pending,created_at.gte.${pendingCutoff})`);

    if (error) {
      return NextResponse.json({ counts: {} });
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      const key = `${row.class_title}|${row.day}|${row.hour}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}
