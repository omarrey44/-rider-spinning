import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const OWNER_EMAIL = 'omar_reii4@hotmail.com';
const OWNER_WHATSAPP = '526565929700';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  try {
    const { email, message } = await req.json();

    if (!message?.trim() || message.trim().length < 5) {
      return NextResponse.json({ error: 'Escribe un mensaje más detallado' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ingresa un correo válido' }, { status: 400 });
    }

    const results: Record<string, boolean> = {};

    // === EMAIL via Resend ===
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: 'RideOn Feedback <onboarding@resend.dev>',
          to: OWNER_EMAIL,
          subject: `💬 Nueva queja/sugerencia de ${escapeHtml(email)}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
              <h2 style="color:#1dd4e8;">Nueva queja / sugerencia</h2>
              <p><strong>De:</strong> ${escapeHtml(email)}</p>
              <hr style="border:1px solid #eee;" />
              <p style="white-space:pre-wrap;line-height:1.6;">${escapeHtml(message.trim())}</p>
              <hr style="border:1px solid #eee;" />
              <small style="color:#999;">RideOn Spinning · Sistema de feedback</small>
            </div>
          `,
        });
        results.email = true;
      } catch (err) {
        console.error('[feedback] email error:', err);
        results.email = false;
      }
    } else {
      console.warn('[feedback] RESEND_API_KEY not set');
      results.email = false;
    }

    // === WHATSAPP via CallMeBot ===
    const cbKey = process.env.CALLMEBOT_API_KEY;
    if (cbKey) {
      try {
        const text = encodeURIComponent(
          `💬 RideOn Feedback\nDe: ${email}\n\n${message.trim().slice(0, 1000)}`
        );
        const url = `https://api.callmebot.com/whatsapp.php?phone=${OWNER_WHATSAPP}&text=${text}&apikey=${cbKey}`;
        const waRes = await fetch(url);
        results.whatsapp = waRes.ok;
      } catch (err) {
        console.error('[feedback] whatsapp error:', err);
        results.whatsapp = false;
      }
    } else {
      console.warn('[feedback] CALLMEBOT_API_KEY not set');
      results.whatsapp = false;
    }

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
