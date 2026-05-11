import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email, phone, source } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Ingresa un correo electrónico válido' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from('waitlist').insert({
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      source: source || 'unknown',
    });

    if (error) {
      // Unique constraint violation: already registered
      if (error.code === '23505') {
        return NextResponse.json(
          { ok: true, already_registered: true },
          { status: 200 }
        );
      }
      console.error('[waitlist] insert error:', error);
      return NextResponse.json(
        { error: 'No pudimos registrar tu correo. Intenta de nuevo.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
