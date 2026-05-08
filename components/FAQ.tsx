'use client';

import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: '¿Es mi primera vez. Necesito experiencia previa?',
    a: 'Para nada. Las primeras filas tienen mejor visibilidad del instructor; las filas 3 y 4 son las más cómodas para empezar a tu ritmo. Llega 10 minutos antes y el instructor te ayuda con la postura y la resistencia.',
  },
  {
    q: '¿Qué llevo a mi primera clase?',
    a: 'Ropa cómoda que respire, una toalla pequeña, una botella de agua, y tenis deportivos cerrados. Si tienes cleats SPD compatibles puedes traerlos; si no, las bicis tienen pedales con jaulas universales.',
  },
  {
    q: '¿Hay regaderas y vestidores?',
    a: 'Sí. Vestidores con regaderas, lockers, secadora de pelo y amenidades básicas. Trae tu candado o pide uno en recepción.',
  },
  {
    q: '¿Qué pasa si llego tarde?',
    a: 'Tu lugar se libera 5 minutos después del inicio de la clase para no interrumpir al grupo. Si llegas dentro de los primeros 5 minutos, puedes integrarte. Si pierdes la clase no se aplica reembolso.',
  },
  {
    q: '¿Puedo cancelar mi reserva?',
    a: 'Sí. Para clases sueltas: cancela hasta 4 horas antes para reembolso completo. Entre 2 y 4h obtienes crédito para otra clase. Menos de 2h o no-show no aplica reembolso. Consulta la política completa en el footer.',
  },
  {
    q: '¿Cómo funciona la lista de espera?',
    a: 'Si la clase está llena, te anotas en lista de espera al intentar reservar. Si alguien cancela, te avisamos por SMS y correo. Tienes 15 minutos para confirmar tu lugar.',
  },
  {
    q: '¿Hay estacionamiento?',
    a: 'Contamos con estacionamiento gratuito para clientes durante el horario de tu clase reservada. La zona también tiene amplio espacio en la calle.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="faq" id="faq">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2>Lo que <span className="text-red">necesitas saber</span> antes de tu primer ride</h2>
          <p>¿Tu primera vez? Te respondemos las dudas más comunes.</p>
        </div>

        <div className="faq-list" role="list">
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            const id = `faq-item-${i}`;
            return (
              <div key={i} className={`faq-item ${open ? 'open' : ''}`} role="listitem">
                <button
                  type="button"
                  className="faq-trigger"
                  aria-expanded={open}
                  aria-controls={id}
                  onClick={() => setOpenIndex(open ? null : i)}
                >
                  <span className="faq-question">{item.q}</span>
                  <span className="faq-chevron" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </button>
                <div className="faq-answer" id={id} hidden={!open}>
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="faq-cta">
          ¿No encontraste tu pregunta?{' '}
          <a href="https://wa.me/526562929700" target="_blank" rel="noopener noreferrer">Mándanos un WhatsApp →</a>
        </p>
      </div>
    </section>
  );
}
