import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad · Rideon Spinning Studio',
  description: 'Aviso de privacidad de Rideon Spinning Studio en cumplimiento de la LFPDPPP.',
};

export default function PrivacidadPage() {
  return (
    <main className="legal-page">
      <div className="container legal-container">
        <Link href="/" className="legal-back">← Volver al inicio</Link>
        <h1>Aviso de Privacidad</h1>
        <p className="legal-meta">Última actualización: 5 de mayo de 2026</p>

        <section>
          <h2>Identidad del responsable</h2>
          <p>
            Rideon Spinning Studio (en adelante &ldquo;Rideon&rdquo;) con domicilio
            en Chihuahua, México, es responsable del tratamiento de sus
            datos personales conforme a la Ley Federal de Protección de
            Datos Personales en Posesión de los Particulares (LFPDPPP) y
            su reglamento.
          </p>
        </section>

        <section>
          <h2>Datos que recabamos</h2>
          <ul>
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono (opcional)</li>
            <li>Información de pago (procesada directamente por Stripe; Rideon no almacena tarjetas)</li>
            <li>Historial de clases reservadas</li>
          </ul>
        </section>

        <section>
          <h2>Finalidades del tratamiento</h2>
          <h3>Finalidades primarias (necesarias para prestar el servicio):</h3>
          <ul>
            <li>Procesar reservas de clases y pagos</li>
            <li>Enviar confirmaciones y recordatorios de clase</li>
            <li>Atender solicitudes de cancelación o reembolso</li>
            <li>Cumplir obligaciones fiscales y legales</li>
          </ul>
          <h3>Finalidades secundarias (opcionales):</h3>
          <ul>
            <li>Enviar promociones y novedades del estudio</li>
            <li>Análisis estadístico para mejorar el servicio</li>
          </ul>
          <p>
            Puedes oponerte a las finalidades secundarias enviando un
            correo a <a href="mailto:privacidad@rideonspinning.com">privacidad@rideonspinning.com</a>.
          </p>
        </section>

        <section>
          <h2>Transferencias de datos</h2>
          <p>
            Compartimos datos con los siguientes terceros estrictamente
            para operar el servicio:
          </p>
          <ul>
            <li><strong>Stripe Payments Inc.</strong> — procesamiento de pagos</li>
            <li><strong>Supabase Inc.</strong> — almacenamiento de reservas</li>
            <li><strong>Vercel Inc.</strong> — hospedaje del sitio</li>
            <li><strong>Resend</strong> — envío de correos transaccionales</li>
          </ul>
          <p>
            Todos cuentan con políticas de privacidad alineadas con
            estándares internacionales (GDPR, CCPA).
          </p>
        </section>

        <section>
          <h2>Derechos ARCO</h2>
          <p>
            Tienes derecho a <strong>Acceder</strong>, <strong>Rectificar</strong>,
            {' '}<strong>Cancelar</strong> u <strong>Oponerte</strong> al tratamiento
            de tus datos. Para ejercerlos envía solicitud a{' '}
            <a href="mailto:privacidad@rideonspinning.com">privacidad@rideonspinning.com</a>{' '}
            con copia de tu identificación. Responderemos en un máximo de
            20 días hábiles.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p>
            Usamos cookies esenciales para el funcionamiento del sitio y,
            con tu consentimiento, cookies analíticas para entender el uso.
            Puedes desactivarlas desde la configuración de tu navegador.
          </p>
        </section>

        <section>
          <h2>Cambios al aviso</h2>
          <p>
            Cualquier modificación se publicará en esta misma página. Te
            recomendamos revisarla periódicamente.
          </p>
        </section>

        <section>
          <h2>Contacto</h2>
          <p>
            <strong>Departamento de Privacidad</strong><br />
            Correo: <a href="mailto:privacidad@rideonspinning.com">privacidad@rideonspinning.com</a><br />
            Domicilio: Chihuahua, Chihuahua, México
          </p>
        </section>
      </div>
    </main>
  );
}
