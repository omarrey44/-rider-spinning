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
            a <a href="mailto:contacto@rideonspinning.com">contacto@rideonspinning.com</a>.
          </p>
        </section>

        <section>
          <h2>Plazos de cancelación por plan</h2>

          <h3>Clase suelta</h3>
          <ul>
            <li><strong>Más de 4 horas antes:</strong> reembolso del 100%</li>
            <li><strong>Entre 2 y 4 horas antes:</strong> crédito para otra clase (sin reembolso en efectivo)</li>
            <li><strong>Menos de 2 horas antes / no-show:</strong> sin reembolso ni crédito</li>
          </ul>

          <h3>Pack de 5 clases</h3>
          <ul>
            <li><strong>Más de 2 horas antes:</strong> la clase regresa al pack sin penalización</li>
            <li><strong>Menos de 2 horas antes:</strong> se descuenta del pack</li>
            <li>El pack tiene vigencia de 30 días desde la compra; las clases no usadas no se reembolsan</li>
          </ul>

          <h3>Mensualidad ilimitada</h3>
          <ul>
            <li>Las cancelaciones de clases individuales no aplican (clases ilimitadas)</li>
            <li>La mensualidad puede cancelarse antes del próximo cargo automático sin penalización</li>
            <li>No hay reembolso por días no usados dentro del periodo activo</li>
          </ul>
        </section>

        <section>
          <h2>Lista de espera</h2>
          <p>
            Si una clase está llena, puedes anotarte en lista de espera. Si
            alguien cancela y se libera tu lugar, te notificamos por correo
            y SMS hasta 2 horas antes de la clase. Tienes 15 minutos para
            confirmar; si no, se asigna al siguiente en la lista.
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
            reembolsos: <a href="mailto:contacto@rideonspinning.com">contacto@rideonspinning.com</a>.
            Respondemos en un máximo de 48 horas hábiles.
          </p>
        </section>
      </div>
    </main>
  );
}
