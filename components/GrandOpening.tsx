import { AlarmClockIcon, ArrowRight, BoltIcon, CalendarDaysIcon, StarIcon } from './Icons';

function MapPinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const eventFacts = [
  { Icon: CalendarDaysIcon, label: 'Sábado 8 de agosto' },
  { Icon: AlarmClockIcon, label: '8:00 AM — 1:00 PM' },
  { Icon: MapPinIcon, label: 'Plaza San Agustín · Local 23' },
];

export default function GrandOpening() {
  return (
    <section className="opening opening--compact" id="apertura" aria-labelledby="opening-title">
      <div className="opening-bg" aria-hidden="true" />
      <div className="opening-overlay" aria-hidden="true" />

      <div className="container opening-compact-grid">
        <div className="opening-compact-copy">
          <span className="opening-kicker">
            <StarIcon size={13} /> Evento de apertura · Cupo limitado
          </span>

          <h2 id="opening-title" className="opening-compact-title">
            Gran Apertura.
            <span>Tu primer ride va por la casa.</span>
          </h2>

          <p className="opening-compact-lead">
            Estrena la experiencia Rideon con una clase gratuita. Elige horario y bici en línea; nosotros ponemos el equipo y la energía.
          </p>

          <div className="opening-event-facts" aria-label="Detalles del evento">
            {eventFacts.map((fact) => (
              <span key={fact.label} className="opening-event-fact">
                <fact.Icon size={17} /> {fact.label}
              </span>
            ))}
          </div>
        </div>

        <aside className="opening-compact-action" aria-label="Reservar apertura">
          <span className="opening-action-label">Sólo durante la apertura</span>
          <strong>$0 MXN</strong>
          <p>Reserva una bici por persona. Llega 10 minutos antes para ajustar tu equipo.</p>
          <a href="#horarios" className="btn opening-btn-primary">
            <BoltIcon size={16} /> Elegir horario <ArrowRight size={16} />
          </a>
        </aside>
      </div>
    </section>
  );
}
