import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidad · Rideon Spinning Studio',
  description: 'Cómo recopilamos, usamos y protegemos tu información personal en Rideon Spinning Studio.',
};

export default function PrivacidadPage() {
  return (
    <main className="legal-page">
      <div className="container legal-container">
        <Link href="/" className="legal-back">← Volver al inicio</Link>
        <h1>Política de Privacidad</h1>
        <p className="legal-meta">Última actualización: 19 de mayo de 2026</p>

        <section>
          <h2>1. Responsable del tratamiento</h2>
          <p>
            Rideon Spinning Studio, ubicado en Plaza San Agustín local 23, Chihuahua, México,
            es responsable del tratamiento de los datos personales que recopilamos a través de este sitio web.
          </p>
        </section>

        <section>
          <h2>2. Datos que recopilamos</h2>
          <p>Al realizar una reserva o compra recopilamos:</p>
          <ul>
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono (opcional)</li>
            <li>Información de pago procesada por Stripe (no almacenamos datos de tarjeta)</li>
            <li>Preferencias de clase y objetivo personal (opcional)</li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidad del tratamiento</h2>
          <p>Utilizamos tus datos para:</p>
          <ul>
            <li>Gestionar y confirmar tus reservas de clase</li>
            <li>Enviarte confirmaciones y recordatorios por correo electrónico</li>
            <li>Administrar tu membresía o pack de clases</li>
            <li>Procesar pagos de forma segura a través de Stripe</li>
          </ul>
          <p>No utilizamos tus datos para publicidad de terceros ni los vendemos.</p>
        </section>

        <section>
          <h2>4. Procesadores de datos terceros</h2>
          <ul>
            <li><strong>Stripe</strong> — procesamiento de pagos (política: stripe.com/privacy)</li>
            <li><strong>Supabase</strong> — almacenamiento de datos (política: supabase.com/privacy)</li>
            <li><strong>Gmail / Google</strong> — envío de correos de confirmación</li>
          </ul>
        </section>

        <section>
          <h2>5. Conservación de datos</h2>
          <p>
            Conservamos tus datos de reserva mientras tu cuenta esté activa y por un período
            mínimo de 12 meses para cumplimiento fiscal. Puedes solicitar la eliminación de
            tus datos en cualquier momento.
          </p>
        </section>

        <section>
          <h2>6. Tus derechos</h2>
          <p>Tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos (derechos ARCO).
          Para ejercerlos, contáctanos por correo electrónico.</p>
        </section>

        <section>
          <h2>7. Seguridad</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información.
            Los pagos se procesan mediante conexiones cifradas SSL/TLS a través de Stripe.
          </p>
        </section>

        <section>
          <h2>8. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política ocasionalmente. La fecha de la última actualización
            aparece al inicio de este documento.
          </p>
        </section>

        <div className="legal-footer-links">
          <Link href="/terminos">Términos de Servicio</Link>
          <Link href="/politica-de-cancelacion">Política de Cancelación</Link>
        </div>
      </div>
    </main>
  );
}
