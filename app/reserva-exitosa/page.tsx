import Link from 'next/link';
import { getStripe } from '@/lib/stripe';
import SuccessConfetti from '@/components/SuccessConfetti';

export const dynamic = 'force-dynamic';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: {
    session_id?: string;
    test?: string;
    customer_name?: string;
    customer_email?: string;
    class_title?: string;
    instructor_name?: string;
    day?: string;
    hour?: string;
    bike_number?: string;
    bike_row?: string;
    amount?: string;
  };
}) {
  let sessionData: {
    customerName: string;
    className: string;
    instructorName: string;
    day: string;
    hour: string;
    bikeNumber: string;
    bikeRow: string;
    amountTotal: string;
    currency: string;
    customerEmail: string;
  } | null = null;

  if (searchParams?.test === 'true') {
    sessionData = {
      customerName: (searchParams.customer_name as string) || 'Rider',
      customerEmail: (searchParams.customer_email as string) || '',
      className: (searchParams.class_title as string) || '',
      instructorName: (searchParams.instructor_name as string) || '',
      day: (searchParams.day as string) || '',
      hour: (searchParams.hour as string) || '',
      bikeNumber: (searchParams.bike_number as string) || '',
      bikeRow: (searchParams.bike_row as string) || '',
      amountTotal: (searchParams.amount as string) || '',
      currency: 'MXN',
    };
  } else if (searchParams?.session_id && process.env.STRIPE_SECRET_KEY) {
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
          customerEmail:
            session.customer_details?.email ||
            session.metadata?.customer_email ||
            '',
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
    <main className="success-page">
      <SuccessConfetti />
      <div className="success-card">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <span className="success-eyebrow">● Reserva confirmada</span>

        <h1 className="success-title">
          Nos vemos en <span className="text-red">clase</span>
        </h1>

        {sessionData && (
          <p className="success-greeting">
            Hola <strong>{sessionData.customerName}</strong> — listo, tu lugar está apartado.
          </p>
        )}

        {sessionData ? (
          <div className="success-details">
            <div className="success-row">
              <span>Clase</span>
              <strong>{sessionData.className}</strong>
            </div>
            <div className="success-row">
              <span>Instructor</span>
              <strong>{sessionData.instructorName}</strong>
            </div>
            <div className="success-row">
              <span>Día</span>
              <strong>{sessionData.day}</strong>
            </div>
            <div className="success-row">
              <span>Hora</span>
              <strong>{sessionData.hour}</strong>
            </div>
            <div className="success-row">
              <span>Bici</span>
              <strong>#{String(sessionData.bikeNumber).padStart(2, '0')} · Fila {sessionData.bikeRow}</strong>
            </div>
            <div className="success-divider" />
            <div className="success-row success-row-total">
              <span>Pagado</span>
              <strong>${sessionData.amountTotal} {sessionData.currency}</strong>
            </div>
          </div>
        ) : (
          <div className="success-fallback">
            <p>Pago procesado correctamente. Recibirás la confirmación por correo.</p>
          </div>
        )}

        <div className="success-tips">
          <h3>Antes de tu clase</h3>
          <ul>
            <li><strong>Llega 10 min antes</strong> — ajustamos la bici a tu altura</li>
            <li><strong>Trae toalla y agua</strong> — vas a sudar</li>
            <li><strong>Ropa cómoda y tenis</strong> — los cleats SPD también funcionan</li>
            <li><strong>Cancelación gratuita</strong> hasta 4h antes</li>
          </ul>
        </div>

        {sessionData?.customerEmail && (
          <p className="success-email-note">
            Confirmación enviada a <strong>{sessionData.customerEmail}</strong>
          </p>
        )}

        <div className="success-actions">
          <Link href="/" className="btn btn-primary btn-lg">
            Volver al inicio
          </Link>
          <Link href="/#mis-reservas" className="btn btn-outline-on-dark">
            Ver mis reservas
          </Link>
        </div>
      </div>
    </main>
  );
}
