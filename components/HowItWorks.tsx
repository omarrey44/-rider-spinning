export default function HowItWorks() {
  return (
    <section className="how" id="clases">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Cómo funciona</span>
          <h2>Reserva tu clase en <span className="text-red">3 pasos</span></h2>
          <p>Sin filas, sin llamadas, sin complicaciones. Todo desde tu celular.</p>
        </div>

        <div className="how-grid">
          <article className="how-card">
            <span className="how-num">01</span>
            <div className="how-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            </div>
            <h3>Elige tu horario</h3>
            <p>Mira la disponibilidad en tiempo real y filtra por instructor o tipo de clase.</p>
          </article>
          <article className="how-card">
            <span className="how-num">02</span>
            <div className="how-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l5-9h5l3 9M11 8l3 4" /></svg>
            </div>
            <h3>Selecciona tu bici</h3>
            <p>Vista del salón en tiempo real. Escoge tu posición favorita en la sala.</p>
          </article>
          <article className="how-card">
            <span className="how-num">03</span>
            <div className="how-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
            </div>
            <h3>Paga y listo</h3>
            <p>Pago seguro con tarjeta. Recibe tu confirmación al instante.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
