import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const formattedDate = data.classDate
    ? new Date(data.classDate + 'T00:00:00').toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : `${data.day}`;

  const ticketNumber = data.confirmationNumber || 'N/A';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2a9d8f 0%, #1d6e63 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .ticket-box { background: white; border: 2px solid #2a9d8f; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .ticket-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .ticket-number { font-size: 32px; font-weight: 700; color: #2a9d8f; font-family: monospace; letter-spacing: 2px; margin: 10px 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .detail-row { margin: 15px 0; padding: 12px; background: white; border-left: 4px solid #2a9d8f; }
        .detail-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-value { font-size: 16px; font-weight: 600; color: #333; margin-top: 5px; }
        .amount { font-size: 24px; color: #2a9d8f; font-weight: 700; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>¡Tu reserva está confirmada! 🚴</h1>
        </div>
        <div class="ticket-box">
          <div class="ticket-label">Número de Confirmación</div>
          <div class="ticket-number">${ticketNumber}</div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #888;">Presenta este código en tu primera clase</p>
        </div>
        <div class="content">
          <p style="font-size: 20px; font-weight: 700; color: #2a9d8f; margin: 0 0 10px 0;">¡HOLA RIDDER!</p>
          <p style="font-size: 14px; color: #666; margin: 0 0 20px 0;"><strong>Reserva de: ${data.customerName}</strong></p>
          <p>Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:</p>

          <div class="detail-row">
            <div class="detail-label">Clase</div>
            <div class="detail-value">${data.classTitle}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">Instructor</div>
            <div class="detail-value">${data.instructorName}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">Fecha y Hora</div>
            <div class="detail-value">${formattedDate} • ${data.hour}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">Tu Bici</div>
            <div class="detail-value">#${String(data.bikeNumber).padStart(2, '0')} • Fila ${data.bikeRow}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">Monto</div>
            <div class="detail-value amount">$${data.amount.toLocaleString('es-MX')} MXN</div>
          </div>

          <p style="margin-top: 30px;">
            <strong>¿Qué sigue?</strong><br>
            • Llega 15 minutos antes de la clase<br>
            • Trae tu botella de agua<br>
            • ¡Prepárate para una clase épica!<br>
          </p>

          <div style="background: white; border: 2px dashed #2a9d8f; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="font-size: 12px; color: #888; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Código QR para presentar en recepción</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketNumber}" alt="QR Code" style="width: 150px; height: 150px; margin: 10px 0;">
            <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">Presenta este código en tu llegada</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://rider-spinning.vercel.app/?email=${encodeURIComponent(data.customerEmail)}#mis-reservas" style="display: inline-block; background: #2a9d8f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verificar mi Reserva</a>
          </div>

          <div class="footer">
            <p><strong>Ubicación:</strong> Polanco, CDMX</p>
            <p>📞 Soporte: contacto@rideonstudio.com</p>
            <p>Rideon Studio • Tu club de spinning favorito</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: data.customerEmail,
      subject: `Confirmación de tu clase: ${data.classTitle}`,
      html: htmlContent,
    });
    console.log(`[email] Confirmación enviada a ${data.customerEmail}`);
  } catch (err) {
    console.error('[email] Error al enviar:', err);
  }
}
