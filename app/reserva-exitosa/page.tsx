import Link from 'next/link';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  let sessionData = null;

  if (searchParams?.session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(
        searchParams.session_id
      );

      if (session.payment_status === 'paid') {
        sessionData = {
          customerName:
            session.metadata?.customer_name ||
            session.customer_details?.name ||
            'Rider',
          className: session.metadata?.class_title || '',
          instructorName: session.metadata?.instructor_name || '',
          day: session.metadata?.day || '',
          hour: session.metadata?.hour || '',
          bikeNumber: session.metadata?.bike_number || '',
          bikeRow: session.metadata?.bike_row || '',
          amountTotal: session.amount_total
            ? (session.amount_total / 100).toLocaleString('es-MX')
            : '',
          currency: session.currency?.toUpperCase() || 'MXN',
        };
      }
    } catch {
      // Session not found or error retrieving
    }
  }

  return (
    <main className="success-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', padding: '24px' }}>
      <div className="success-card" style={{ background: 'var(--white)', borderRadius: '24px', maxWidth: '520px', width: '100%', padding: '48px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        <div className="success-icon" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
          ✓
        </div>

        <span className="modal-eyebrow" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal-dark)', display: 'block', marginBottom: '8px' }}>
          ¡Reserva confirmada!
        </span>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, margin: '0 0 24px' }}>
          Nos vemos en clase
        </h1>

        {sessionData ? (
          <div className="booking-details" style={{ textAlign: 'left', background: 'var(--gray-soft)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-muted)' }}>
              Hola, <strong style={{ color: 'var(--text-dark)' }}>{sessionData.customerName}</strong>
            </p>

            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Clase</span>
                <strong style={{ fontSize: '14px' }}>{sessionData.className}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Instructor</span>
                <strong style={{ fontSize: '14px' }}>{sessionData.instructorName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Día</span>
                <strong style={{ fontSize: '14px' }}>{sessionData.day}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Hora</span>
                <strong style={{ fontSize: '14px' }}>{sessionData.hour}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Bici</span>
                <strong style={{ fontSize: '14px' }}>#{sessionData.bikeNumber} · Fila {sessionData.bikeRow}</strong>
              </div>
              <div style={{ height: '1px', background: 'var(--gray-mid)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Pagado</span>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
                  ${sessionData.amountTotal} {sessionData.currency}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="booking-fallback" style={{ background: 'var(--gray-soft)', borderRadius: '16px', padding: '20px', marginBottom: '32px' }}>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)' }}>
              Tu pago fue procesado correctamente. Te enviaremos la confirmación por correo.
            </p>
          </div>
        )}

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
          Revisa tu bandeja de entrada para los detalles completos y cómo llegar al estudio.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
