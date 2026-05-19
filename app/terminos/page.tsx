import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos de Servicio · Rideon Spinning Studio',
  description: 'Condiciones de uso del servicio de Rideon Spinning Studio.',
};

export default function TerminosPage() {
  return (
    <main className="legal-page">
      <div className="container legal-container">
        <Link href="/" className="legal-back">← Volver al inicio</Link>
        <h1>Términos de Servicio</h1>
        <p className="legal-meta">Última actualización: 19 de mayo de 2026</p>

        <section>
          <h2>1. Aceptación</h2>
          <p>
            Al reservar una clase o adquirir una membresía en Rideon Spinning Studio aceptas estos
            términos. Si no estás de acuerdo, no utilices nuestros servicios.
          </p>
        </section>

        <section>
          <h2>2. Servicios</h2>
          <p>
            Rideon Spinning Studio ofrece clases de ciclismo indoor en Plaza San Agustín local 23,
            Chihuahua, México. Las clases están sujetas a disponibilidad y pueden ser modificadas
            o canceladas por causas de fuerza mayor.
          </p>
        </section>

        <section>
          <h2>3. Reservas y pagos</h2>
          <ul>
            <li>Las reservas se confirman una vez procesado el pago exitosamente.</li>
            <li>Los precios están expresados en pesos mexicanos (MXN) e incluyen IVA.</li>
            <li>Los pagos se procesan de forma segura a través de Stripe.</li>
            <li>No almacenamos datos de tarjetas de crédito o débito.</li>
          </ul>
        </section>

        <section>
          <h2>4. Cancelaciones y reembolsos</h2>
          <p>
            Consulta nuestra{' '}
            <Link href="/politica-de-cancelacion">Política de Cancelación</Link>{' '}
            para conocer los plazos y condiciones aplicables según el tipo de compra.
          </p>
        </section>

        <section>
          <h2>5. Membresías y packs</h2>
          <ul>
            <li>El Pack 3 Clases tiene vigencia de 7 días a partir de la compra.</li>
            <li>La Membresía Mensual tiene vigencia de 30 días a partir de la compra.</li>
            <li>Los créditos no utilizados al vencimiento no son reembolsables.</li>
            <li>Se permite 1 clase por día con membresía o pack.</li>
          </ul>
        </section>

        <section>
          <h2>6. Conducta en el estudio</h2>
          <ul>
            <li>Llega al menos 10 minutos antes de tu clase.</li>
            <li>Respeta las indicaciones del instructor en todo momento.</li>
            <li>Rideon se reserva el derecho de negar el servicio ante conducta inapropiada.</li>
          </ul>
        </section>

        <section>
          <h2>7. Responsabilidad</h2>
          <p>
            Rideon Spinning Studio no se hace responsable de lesiones derivadas del uso
            incorrecto del equipo o por no seguir las indicaciones del instructor. Al reservar
            confirmas estar en condiciones físicas aptas para la actividad.
          </p>
        </section>

        <section>
          <h2>8. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento.
            Los cambios entran en vigor al publicarse en este sitio.
          </p>
        </section>

        <section>
          <h2>9. Ley aplicable</h2>
          <p>
            Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.
            Cualquier disputa se resolverá ante los tribunales competentes de Chihuahua, México.
          </p>
        </section>

        <div className="legal-footer-links">
          <Link href="/privacidad">Política de Privacidad</Link>
          <Link href="/politica-de-cancelacion">Política de Cancelación</Link>
        </div>
      </div>
    </main>
  );
}
