import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('bookings')
      .select('class_title, day, hour')
      .in('status', ['pending', 'confirmed']);

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
