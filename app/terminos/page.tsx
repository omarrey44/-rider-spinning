import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones · Rideon Spinning Studio',
  description: 'Términos y condiciones de uso del servicio Rideon Spinning Studio.',
};

export default function TerminosPage() {
  return (
    <main className="legal-page">
      <div className="container legal-container">
        <Link href="/" className="legal-back">← Volver al inicio</Link>
        <h1>Términos y Condiciones</h1>
        <p className="legal-meta">Última actualización: 5 de mayo de 2026</p>

        <section>
          <h2>1. Aceptación de los términos</h2>
          <p>
            Al usar el sitio rideonspinning.com y reservar clases en Rideon
            Spinning Studio (en adelante, &ldquo;Rideon&rdquo;, &ldquo;nosotros&rdquo;), aceptas estos
            términos en su totalidad. Si no estás de acuerdo, no uses el
            servicio.
          </p>
        </section>

        <section>
          <h2>2. Reservas y pagos</h2>
          <p>
            Las reservas se confirman al completar el pago. Los pagos se
            procesan mediante Stripe; Rideon no almacena datos de tarjetas.
            Los precios están expresados en pesos mexicanos (MXN) e incluyen
            IVA cuando aplique.
          </p>
        </section>

        <section>
          <h2>3. Cancelaciones y reembolsos</h2>
          <p>
            Consulta nuestra <Link href="/politica-de-cancelacion">política
            de cancelación</Link> para conocer los plazos específicos por
            tipo de plan.
          </p>
        </section>

        <section>
          <h2>4. Conducta en el estudio</h2>
          <p>
            Rideon se reserva el derecho de admisión. Comportamiento
            agresivo, faltas de respeto al personal o a otros riders, o
            llegar bajo influencia de sustancias resultará en cancelación
            de la reserva sin reembolso.
          </p>
        </section>

        <section>
          <h2>5. Riesgos y exención de responsabilidad</h2>
          <p>
            El spinning es una actividad física de alta intensidad. Al
            reservar declaras estar en condiciones físicas para participar.
            Consulta a tu médico si tienes condiciones cardíacas, presión
            alta, o estás embarazada. Rideon no se hace responsable por
            lesiones derivadas del esfuerzo propio del usuario.
          </p>
        </section>

        <section>
          <h2>6. Propiedad intelectual</h2>
          <p>
            Todo el contenido del sitio (logo, diseño, textos, imágenes)
            es propiedad de Rideon Spinning Studio. No puede ser
            reproducido sin autorización por escrito.
          </p>
        </section>

        <section>
          <h2>7. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos en cualquier momento. La
            versión vigente es la publicada en esta página. El uso
            continuado del servicio implica aceptación de los cambios.
          </p>
        </section>

        <section>
          <h2>8. Jurisdicción</h2>
          <p>
            Estos términos se rigen por las leyes de México. Cualquier
            disputa se resolverá en los tribunales de la Ciudad de
            Chihuahua, Chihuahua.
          </p>
        </section>

        <section>
          <h2>9. Contacto</h2>
          <p>
            Para dudas sobre estos términos: <a href="mailto:contacto@rideonspinning.com">contacto@rideonspinning.com</a>
          </p>
        </section>
      </div>
    </main>
  );
}
