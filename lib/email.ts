import { Resend } from 'resend';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'administracion@rideonspinningstudio.com';
// Dominio verificado en Resend (rideonspinningstudio.com.mx) → envía a cualquier destinatario
const FROM = 'RideOn Spinning <noreply@rideonspinningstudio.com.mx>';

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
  return new Resend(process.env.RESEND_API_KEY);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Admin alert (email) ──────────────────────────────────────────────────────

async function sendAdminAlert(subject: string, html: string) {
  try {
    await getResend().emails.send({ from: FROM, to: ADMIN_EMAIL, subject, html });
    console.log(`[email] Admin alert sent: ${subject}`);
  } catch (err) {
    console.error('[email] Admin alert error:', err);
  }
}

// ── Admin alert (WhatsApp via CallMeBot) ─────────────────────────────────────

export async function sendWhatsAppAdminAlert(message: string) {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  const phone = process.env.WHATSAPP_ADMIN;
  if (!apiKey || !phone) {
    console.warn('[whatsapp] CALLMEBOT_API_KEY or WHATSAPP_ADMIN not set');
    return;
  }
  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      console.log('[whatsapp] Admin alert sent');
    } else {
      console.error('[whatsapp] Error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[whatsapp] Error:', err);
  }
}

// ── Booking confirmation ─────────────────────────────────────────────────────

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  classTitle: string;
  instructorName: string;
  day: string;
  hour: string;
  classDate: string | null;
  bikeNumber: number;
  bikeRow: number;
  amount: number;
  confirmationNumber?: string;
  goal?: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const formattedDate = data.classDate
    ? new Date(data.classDate + 'T00:00:00').toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : data.day;

  const ticketNumber = data.confirmationNumber || 'N/A';

  const customerHtml = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#2a9d8f 0%,#1d6e63 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .ticket-box{background:white;border:2px solid #2a9d8f;border-radius:8px;padding:20px;margin:20px 0;text-align:center;}
      .ticket-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;}
      .ticket-number{font-size:32px;font-weight:700;color:#2a9d8f;font-family:monospace;letter-spacing:2px;margin:10px 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .detail-row{margin:15px 0;padding:12px;background:white;border-left:4px solid #2a9d8f;}
      .detail-label{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;}
      .detail-value{font-size:16px;font-weight:600;color:#333;margin-top:5px;}
      .amount{font-size:24px;color:#2a9d8f;font-weight:700;}
      .footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#888;}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>¡Tu reserva está confirmada! 🚴</h1></div>
      <div class="ticket-box">
        <div class="ticket-label">Número de Confirmación</div>
        <div class="ticket-number">${ticketNumber}</div>
        <p style="margin:10px 0 0 0;font-size:12px;color:#888;">Presenta este código en tu primera clase</p>
      </div>
      <div class="content">
        <p style="font-size:20px;font-weight:700;color:#2a9d8f;margin:0 0 10px 0;">¡HOLA RIDDER!</p>
        <p>Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:</p>
        <div class="detail-row"><div class="detail-label">Clase</div><div class="detail-value">${escapeHtml(data.classTitle)}</div></div>
        <div class="detail-row"><div class="detail-label">Instructor</div><div class="detail-value">${escapeHtml(data.instructorName)}</div></div>
        <div class="detail-row"><div class="detail-label">Fecha y Hora</div><div class="detail-value">${escapeHtml(formattedDate)} • ${escapeHtml(data.hour)}</div></div>
        <div class="detail-row"><div class="detail-label">Tu Bici</div><div class="detail-value">#${String(data.bikeNumber).padStart(2, '0')} • Fila ${data.bikeRow}</div></div>
        <div class="detail-row"><div class="detail-label">Monto</div><div class="detail-value amount">$${data.amount.toLocaleString('es-MX')} MXN</div></div>
        ${data.goal ? `<div class="detail-row"><div class="detail-label">Tu objetivo</div><div class="detail-value">${escapeHtml(data.goal)}</div></div>` : ''}
        <p style="margin-top:30px;"><strong>¿Qué sigue?</strong><br>• Llega 15 minutos antes<br>• Trae tu botella de agua<br>• ¡Prepárate para una clase épica!</p>
        <div style="background:white;border:2px dashed #2a9d8f;border-radius:8px;padding:20px;text-align:center;margin:30px 0;">
          <p style="font-size:12px;color:#888;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.5px;">Código QR para presentar en recepción</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketNumber}" alt="QR Code" style="width:150px;height:150px;margin:10px 0;">
        </div>
        <div style="text-align:center;margin:30px 0;">
          <a href="${escapeHtml(`${BASE_URL}/?email=${encodeURIComponent(data.customerEmail)}#mis-reservas`)}" style="display:inline-block;background:#2a9d8f;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Verificar mi Reserva</a>
        </div>
        <div class="footer">
          <p><strong>Ubicación:</strong> Plaza San Agustín local 23, Chihuahua, México</p>
          <p>📞 Soporte: administracion@rideonspinningstudio.com</p>
          <p>Rideon Spinning Studio</p>
        </div>
      </div>
    </div></body></html>
  `;

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="background:#2a9d8f;color:white;padding:16px 20px;border-radius:8px 8px 0 0;margin:0;">🚴 Nueva Reserva de Clase</h2>
      <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;border:1px solid #ddd;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Confirmación</td><td style="padding:8px 0;font-weight:700;font-family:monospace;">${escapeHtml(ticketNumber)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Cliente</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(data.customerName)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Correo</td><td style="padding:8px 0;">${escapeHtml(data.customerEmail)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Clase</td><td style="padding:8px 0;">${escapeHtml(data.classTitle)} · ${escapeHtml(data.instructorName)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Fecha/Hora</td><td style="padding:8px 0;">${escapeHtml(formattedDate)} · ${escapeHtml(data.hour)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Bici</td><td style="padding:8px 0;">#${String(data.bikeNumber).padStart(2, '0')} · Fila ${data.bikeRow}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Monto</td><td style="padding:8px 0;font-weight:700;color:#2a9d8f;">$${data.amount.toLocaleString('es-MX')} MXN</td></tr>
          ${data.goal ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Objetivo</td><td style="padding:8px 0;color:#e76f51;font-weight:600;">${escapeHtml(data.goal)}</td></tr>` : ''}
        </table>
      </div>
    </div>
  `;

  const amountLabel = data.amount === 0 ? 'Incluido en membresía' : `$${data.amount} MXN`;
  const waMsg = `🚴 *Nueva Reserva RideOn*\n👤 ${data.customerName}\n📧 ${data.customerEmail}\n🏋️ ${data.classTitle} · ${data.instructorName}\n📅 ${formattedDate} · ${data.hour}\n🚲 Bici #${String(data.bikeNumber).padStart(2, '0')} Fila ${data.bikeRow}\n💰 ${amountLabel}\n🔖 Confirmación: ${ticketNumber}${data.goal ? `\n🎯 Objetivo: ${data.goal}` : ''}`;

  try {
    const resend = getResend();
    await Promise.all([
      resend.emails.send({ from: FROM, to: data.customerEmail, subject: `Confirmación de tu clase: ${data.classTitle}`, html: customerHtml }),
      sendAdminAlert(`🚴 Nueva reserva: ${data.customerName} · ${data.classTitle}`, adminHtml),
      sendWhatsAppAdminAlert(waMsg),
    ]);
    console.log(`[email] Confirmación + alerta admin enviadas para ${data.customerEmail}`);
  } catch (err) {
    console.error('[email] Error booking confirmation:', err);
  }
}

// ── Pack confirmation ────────────────────────────────────────────────────────

interface PackEmailData {
  customerName: string;
  customerEmail: string;
  amount: number;
  confirmationNumber: string;
  goal?: string;
}

export async function sendPackConfirmation(data: PackEmailData) {
  const customerHtml = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#2a9d8f 0%,#1d6e63 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .ticket-number{font-size:32px;font-weight:700;color:#2a9d8f;font-family:monospace;letter-spacing:2px;margin:10px 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .detail-row{margin:15px 0;padding:12px;background:white;border-left:4px solid #2a9d8f;}
      .detail-label{font-size:12px;color:#888;text-transform:uppercase;}
      .detail-value{font-size:16px;font-weight:600;margin-top:5px;}
      .amount{font-size:24px;color:#2a9d8f;font-weight:700;}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>¡Tu Pack está listo! 🎟️</h1></div>
      <div style="background:white;border:2px solid #2a9d8f;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Número de Confirmación</div>
        <div class="ticket-number">${escapeHtml(data.confirmationNumber)}</div>
      </div>
      <div class="content">
        <p style="font-size:20px;font-weight:700;color:#2a9d8f;">¡HOLA RIDDER!</p>
        <p><strong>Compra de: ${escapeHtml(data.customerName)}</strong></p>
        <div class="detail-row"><div class="detail-label">Producto</div><div class="detail-value">Pack 3 Horas · válido 7 días</div></div>
        <div class="detail-row"><div class="detail-label">Beneficio</div><div class="detail-value">Cancelación hasta 1h antes por clase</div></div>
        <div class="detail-row"><div class="detail-label">Total pagado</div><div class="detail-value amount">$${data.amount.toLocaleString('es-MX')} MXN</div></div>
        ${data.goal ? `<div class="detail-row"><div class="detail-label">Tu objetivo</div><div class="detail-value">${escapeHtml(data.goal)}</div></div>` : ''}
        <p style="margin-top:24px;"><strong>¿Qué sigue?</strong><br>Reserva tus 3 horas desde el sitio. Cada reserva descuenta una hora del pack.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${BASE_URL}/#horarios" style="display:inline-block;background:#2a9d8f;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Reservar mi primera clase</a>
        </div>
        <div style="text-align:center;font-size:12px;color:#888;border-top:1px solid #ddd;padding-top:20px;margin-top:20px;">
          <p>Rideon Spinning Studio · Plaza San Agustín local 23, Chihuahua, México</p>
        </div>
      </div>
    </div></body></html>
  `;

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="background:#f4a261;color:white;padding:16px 20px;border-radius:8px 8px 0 0;margin:0;">🎟️ Nueva Compra de Pack</h2>
      <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;border:1px solid #ddd;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Confirmación</td><td style="padding:8px 0;font-weight:700;font-family:monospace;">${escapeHtml(data.confirmationNumber)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Cliente</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(data.customerName)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Correo</td><td style="padding:8px 0;">${escapeHtml(data.customerEmail)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Pack</td><td style="padding:8px 0;">3 horas · $${data.amount.toLocaleString('es-MX')} MXN</td></tr>
          ${data.goal ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Objetivo</td><td style="padding:8px 0;color:#e76f51;font-weight:600;">${escapeHtml(data.goal)}</td></tr>` : ''}
        </table>
      </div>
    </div>
  `;

  const waMsg = `🎟️ *Nuevo Pack RideOn*\n👤 ${data.customerName}\n📧 ${data.customerEmail}\n📦 Pack 3 Horas · $300 MXN\n🔖 Confirmación: ${data.confirmationNumber}${data.goal ? `\n🎯 Objetivo: ${data.goal}` : ''}`;

  try {
    const resend = getResend();
    await Promise.all([
      resend.emails.send({ from: FROM, to: data.customerEmail, subject: `¡Tu Pack 3 Horas está confirmado! 🎟️`, html: customerHtml }),
      sendAdminAlert(`🎟️ Nuevo pack: ${data.customerName}`, adminHtml),
      sendWhatsAppAdminAlert(waMsg),
    ]);
    console.log(`[email] Pack confirmación + alerta admin para ${data.customerEmail}`);
  } catch (err) {
    console.error('[email] Error pack confirmation:', err);
  }
}

// ── Subscription confirmation ────────────────────────────────────────────────

interface SubscriptionEmailData {
  customerName: string;
  customerEmail: string;
  amount: number;
  confirmationNumber: string;
  goal?: string;
}

export async function sendSubscriptionConfirmation(data: SubscriptionEmailData) {
  const customerHtml = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .ticket-number{font-size:32px;font-weight:700;color:#2a9d8f;font-family:monospace;letter-spacing:2px;margin:10px 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .detail-row{margin:15px 0;padding:12px;background:white;border-left:4px solid #2a9d8f;}
      .detail-label{font-size:12px;color:#888;text-transform:uppercase;}
      .detail-value{font-size:16px;font-weight:600;margin-top:5px;}
      .amount{font-size:24px;color:#2a9d8f;font-weight:700;}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>¡Bienvenido al Club Ilimitado! 🚴‍♂️</h1></div>
      <div style="background:white;border:2px solid #2a9d8f;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Número de Membresía</div>
        <div class="ticket-number">${escapeHtml(data.confirmationNumber)}</div>
      </div>
      <div class="content">
        <p style="font-size:20px;font-weight:700;color:#2a9d8f;">¡HOLA RIDDER!</p>
        <p><strong>Suscripción de: ${escapeHtml(data.customerName)}</strong></p>
        <div class="detail-row"><div class="detail-label">Plan</div><div class="detail-value">Mensualidad Ilimitada</div></div>
        <div class="detail-row"><div class="detail-label">Beneficios</div><div class="detail-value">Clases ilimitadas · Botella + toalla cortesía</div></div>
        <div class="detail-row"><div class="detail-label">Primer mes</div><div class="detail-value amount">$${data.amount.toLocaleString('es-MX')} MXN</div></div>
        <div class="detail-row"><div class="detail-label">Renovación</div><div class="detail-value">Automática cada mes · Cancela cuando quieras</div></div>
        <div class="detail-row" style="border-left-color:#2a9d8f;"><div class="detail-label">Inscripción</div><div class="detail-value" style="font-size:14px;color:#2a9d8f;">Sin costo este mes · $250 MXN a partir de septiembre</div></div>
        ${data.goal ? `<div class="detail-row"><div class="detail-label">Tu objetivo</div><div class="detail-value">${escapeHtml(data.goal)}</div></div>` : ''}
        <p style="margin-top:24px;"><strong>¿Qué sigue?</strong><br>Reserva tus clases desde el sitio con tu membresía activa. Clases ilimitadas, sin restricciones.</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${BASE_URL}/#horarios" style="display:inline-block;background:#2a9d8f;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Reservar mi primera clase</a>
        </div>
        <div style="text-align:center;font-size:12px;color:#888;border-top:1px solid #ddd;padding-top:20px;margin-top:20px;">
          <p>Rideon Spinning Studio · Plaza San Agustín local 23, Chihuahua, México</p>
        </div>
      </div>
    </div></body></html>
  `;

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="background:#264653;color:white;padding:16px 20px;border-radius:8px 8px 0 0;margin:0;">⭐ Nueva Suscripción Mensual</h2>
      <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;border:1px solid #ddd;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Membresía</td><td style="padding:8px 0;font-weight:700;font-family:monospace;">${escapeHtml(data.confirmationNumber)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Cliente</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(data.customerName)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Correo</td><td style="padding:8px 0;">${escapeHtml(data.customerEmail)}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Plan</td><td style="padding:8px 0;">Mensualidad Ilimitada · $${data.amount.toLocaleString('es-MX')} MXN</td></tr>
          ${data.goal ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;">Objetivo</td><td style="padding:8px 0;color:#e76f51;font-weight:600;">${escapeHtml(data.goal)}</td></tr>` : ''}
        </table>
      </div>
    </div>
  `;

  const waMsg = `⭐ *Nueva Suscripción RideOn*\n👤 ${data.customerName}\n📧 ${data.customerEmail}\n🏷️ Mensualidad Ilimitada · $650 MXN/mes\n🔖 Membresía: ${data.confirmationNumber}${data.goal ? `\n🎯 Objetivo: ${data.goal}` : ''}`;

  try {
    const resend = getResend();
    await Promise.all([
      resend.emails.send({ from: FROM, to: data.customerEmail, subject: `¡Bienvenido al Club Ilimitado de Rideon! 🚴‍♂️`, html: customerHtml }),
      sendAdminAlert(`⭐ Nueva suscripción: ${data.customerName}`, adminHtml),
      sendWhatsAppAdminAlert(waMsg),
    ]);
    console.log(`[email] Suscripción confirmación + alerta admin para ${data.customerEmail}`);
  } catch (err) {
    console.error('[email] Error subscription confirmation:', err);
  }
}

// ── Cancellation confirmation ────────────────────────────────────────────────

interface CancellationEmailData {
  customerName: string;
  customerEmail: string;
  classTitle: string;
  instructorName: string;
  day: string;
  hour: string;
  confirmationNumber: string;
  /** true si se emitió un reembolso automático en Stripe. */
  refunded?: boolean;
  /** Monto reembolsado en MXN (para el detalle del correo). */
  refundAmount?: number;
}

export async function sendCancellationConfirmation(data: CancellationEmailData) {
  const html = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#555 0%,#333 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .detail-row{margin:12px 0;padding:12px;background:white;border-left:4px solid #999;}
      .detail-label{font-size:12px;color:#888;text-transform:uppercase;}
      .detail-value{font-size:15px;font-weight:600;margin-top:4px;}
      .footer{text-align:center;font-size:12px;color:#888;border-top:1px solid #ddd;padding-top:20px;margin-top:20px;}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>Reserva cancelada</h1></div>
      <div class="content">
        <p>Hola <strong>${escapeHtml(data.customerName)}</strong>,</p>
        <p>Tu reserva ha sido cancelada exitosamente.</p>
        <div class="detail-row"><div class="detail-label">Clase</div><div class="detail-value">${escapeHtml(data.classTitle)}</div></div>
        <div class="detail-row"><div class="detail-label">Instructor</div><div class="detail-value">${escapeHtml(data.instructorName)}</div></div>
        <div class="detail-row"><div class="detail-label">Día y hora</div><div class="detail-value">${escapeHtml(data.day)} · ${escapeHtml(data.hour)}</div></div>
        <div class="detail-row"><div class="detail-label">Confirmación</div><div class="detail-value">${escapeHtml(data.confirmationNumber)}</div></div>
        ${data.refunded ? `
        <div class="detail-row" style="border-left-color:#2a9d8f;background:#f0faf8;">
          <div class="detail-label" style="color:#2a9d8f;">Reembolso</div>
          <div class="detail-value">Se procesó el reembolso completo${data.refundAmount ? ` de $${data.refundAmount.toLocaleString('es-MX')} MXN` : ''} a tu método de pago original.</div>
          <div style="font-size:13px;color:#666;margin-top:6px;">El monto puede tardar de 5 a 10 días hábiles en reflejarse en tu estado de cuenta, según tu banco.</div>
        </div>` : ''}
        <p style="margin-top:24px;">Si tienes créditos de pack, ya fueron restituidos a tu cuenta. ¡Esperamos verte pronto!</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${BASE_URL}/#horarios" style="display:inline-block;background:#e10600;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Reservar otra clase</a>
        </div>
        <div class="footer">
          <p>Rideon Spinning Studio · Plaza San Agustín local 23, Chihuahua, México</p>
        </div>
      </div>
    </div></body></html>
  `;
  try {
    await getResend().emails.send({ from: FROM, to: data.customerEmail, subject: `Reserva cancelada: ${data.classTitle}`, html });
    console.log(`[email] Cancelación enviada a ${data.customerEmail}`);
  } catch (err) {
    console.error('[email] Error cancelación:', err);
  }
}

// ── Recordatorio de cuota de mantenimiento ───────────────────────────────────

interface MaintenanceReminderData {
  customerName: string;
  customerEmail: string;
  owedPesos: number;
  blocked: boolean;
}

export async function sendMaintenanceReminder(data: MaintenanceReminderData) {
  const accent = data.blocked ? '#e10600' : '#f4a261';
  const html = `
    <!DOCTYPE html><html><head><style>
      body{font-family:Arial,sans-serif;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:${accent};color:white;padding:28px;text-align:center;border-radius:8px 8px 0 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .amount{font-size:28px;font-weight:800;color:${accent};text-align:center;margin:8px 0 20px;}
      .footer{text-align:center;font-size:12px;color:#888;border-top:1px solid #ddd;padding-top:20px;margin-top:20px;}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>${data.blocked ? '🚫 Reservas en pausa' : '🔧 Cuota de mantenimiento'}</h1></div>
      <div class="content">
        <p>Hola <strong>${escapeHtml(data.customerName)}</strong>,</p>
        <p>${data.blocked
          ? 'Tu cuota de mantenimiento sigue pendiente, por lo que tus reservas están en pausa. Ponte al día para volver a reservar.'
          : 'Este es tu recordatorio de la cuota de mantenimiento de tu membresía.'}</p>
        <div class="amount">$${data.owedPesos.toLocaleString('es-MX')} MXN</div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${BASE_URL}/#mis-reservas" style="display:inline-block;background:${accent};color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Pagar mi cuota</a>
        </div>
        <p style="font-size:13px;color:#666;">Entra a <strong>Mis reservas</strong> con tu correo y número de confirmación para pagar en línea. También puedes pagar en efectivo en el estudio.</p>
        <div class="footer">
          <p>Rideon Spinning Studio · Plaza San Agustín local 23, Chihuahua, México</p>
        </div>
      </div>
    </div></body></html>
  `;
  try {
    await getResend().emails.send({
      from: FROM,
      to: data.customerEmail,
      subject: data.blocked ? 'Tu cuota de mantenimiento está pendiente 🚫' : 'Recordatorio: cuota de mantenimiento 🔧',
      html,
    });
    console.log(`[email] Recordatorio cuota enviado a ${data.customerEmail}`);
  } catch (err) {
    console.error('[email] Error recordatorio cuota:', err);
  }
}
