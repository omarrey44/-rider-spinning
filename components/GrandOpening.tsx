import { CalendarDaysIcon, AlarmClockIcon, CheckIcon, StarIcon } from './Icons';

function MapPinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const recommendations = [
  'Ingresa a nuestro portal y selecciona tu horario y bici a ocupar.',
  'Acude 10 minutos antes para conocer el equipo y ajustarlo a tu medida.',
  'Ropa deportiva y tenis sin plataforma — el equipo lo ponemos nosotros.',
];

export default function GrandOpening() {
  return (
    <section className="opening" id="apertura">
      <div className="container opening-inner">
        <span className="opening-badge">
          <StarIcon size={13} />
          Evento especial
        </span>

        <h2 className="opening-title">
          Gran <span className="text-red">Apertura</span>
        </h2>
        <p className="opening-sub">Te invitamos a conocer el estudio — clase gratuita por hora.</p>

        <div className="opening-facts">
          <div className="opening-fact">
            <CalendarDaysIcon size={18} />
            <div>
              <span className="opening-fact-label">Fecha</span>
              <strong>Sábado 8 de agosto</strong>
            </div>
          </div>
          <div className="opening-fact">
            <AlarmClockIcon size={18} />
            <div>
              <span className="opening-fact-label">Horario</span>
              <strong>9:00 AM – 1:00 PM</strong>
            </div>
          </div>
          <div className="opening-fact">
            <MapPinIcon size={18} />
            <div>
              <span className="opening-fact-label">Ubicación</span>
              <strong>Plaza San Agustín, Av. Tecnológico 4101, Local 23</strong>
            </div>
          </div>
        </div>

        <ul className="opening-tips">
          {recommendations.map((tip) => (
            <li key={tip}>
              <CheckIcon size={14} />
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        <a href="#horarios" className="btn btn-primary btn-lg opening-cta">Reservar mi lugar</a>
      </div>
    </section>
  );
}
