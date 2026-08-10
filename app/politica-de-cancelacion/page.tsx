import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Cancelación · Rideon Spinning Studio',
  description: 'Plazos y condiciones de cancelación y reembolso de Rideon Spinning Studio.',
};

export default function CancelacionPage() {
  return (
    <main className="legal-page">
      <div className="container legal-container">
        <Link href="/" className="legal-back">← Volver al inicio</Link>
        <h1>Política de Cancelación</h1>
        <p className="legal-meta">Última actualización: 5 de mayo de 2026</p>

        <section>
          <h2>Cancelar una reserva</h2>
          <p>
            Puedes cancelar tu reserva desde la sección{' '}
            <Link href="/#mis-reservas">Mis reservas</Link> o escribiendo
            a <a href="mailto:administracion@rideonspinningstudio.com">administracion@rideonspinningstudio.com</a>.
          </p>
        </section>

        <section>
          <h2>Plazos de cancelación por plan</h2>

          <h3>Clase suelta</h3>
          <ul>
            <li><strong>Más de 4 horas antes:</strong> reembolso del 100% a tu método de pago</li>
            <li><strong>Entre 1 y 4 horas antes:</strong> puedes cancelar y liberar tu lugar, pero sin reembolso</li>
            <li><strong>Menos de 1 hora antes / no-show:</strong> no es posible cancelar; sin reembolso</li>
          </ul>

          <h3>Pack de 3 clases</h3>
          <ul>
            <li><strong>Más de 1 hora antes:</strong> la clase regresa al pack sin penalización</li>
            <li><strong>Menos de 1 hora antes / no-show:</strong> se descuenta del pack sin reembolso</li>
            <li>El pack tiene vigencia de 7 días desde la compra; las clases no usadas no se reembolsan</li>
          </ul>

          <h3>Mensualidad ilimitada</h3>
          <ul>
            <li>Las cancelaciones de clases individuales no aplican (clases ilimitadas)</li>
            <li>La mensualidad puede cancelarse antes del próximo cargo automático sin penalización</li>
            <li>No hay reembolso por días no usados dentro del periodo activo</li>
          </ul>
        </section>

        <section>
          <h2>Clases llenas</h2>
          <p>
            Por el momento no contamos con lista de espera. Si una clase está
            llena, revisa otro día u horario. Cuando alguien cancela, el lugar
            vuelve a aparecer disponible automáticamente en el calendario.
          </p>
        </section>

        <section>
          <h2>Reembolsos</h2>
          <p>
            Los reembolsos se procesan al mismo método de pago original a
            través de Stripe. El abono puede tardar entre 5 y 10 días
            hábiles dependiendo de tu banco.
          </p>
        </section>

        <section>
          <h2>Cancelación por parte de Rideon</h2>
          <p>
            Si cancelamos una clase por causa propia (mantenimiento,
            ausencia del instructor, etc.), recibirás reembolso completo
            o un crédito equivalente, a tu elección.
          </p>
        </section>

        <section>
          <h2>Disputas</h2>
          <p>
            Para cualquier disputa relacionada con cancelaciones o
            reembolsos: <a href="mailto:administracion@rideonspinningstudio.com">administracion@rideonspinningstudio.com</a>.
            Respondemos en un máximo de 48 horas hábiles.
          </p>
        </section>
      </div>
    </main>
  );
}
