import { CalendarDaysIcon, AlarmClockIcon, CheckIcon, StarIcon, BoltIcon, ArrowRight } from './Icons';

function MapPinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function GiftIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8S13 3 16.5 3a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}
function ShirtIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}
function TicketIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" /><path d="M13 5v14" strokeDasharray="2 2" />
    </svg>
  );
}
function PeopleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const facts = [
  { Icon: CalendarDaysIcon, label: 'Fecha', value: 'Sábado 8 de agosto' },
  { Icon: AlarmClockIcon, label: 'Horario', value: '8:00 AM – 1:00 PM' },
  { Icon: MapPinIcon, label: 'Ubicación', value: 'Plaza San Agustín,\nAv. Tecnológico 4101, Local 23' },
];

const includes = [
  { Icon: CheckIcon, text: 'Ingresa a nuestro portal y selecciona tu horario y bici a ocupar.' },
  { Icon: PeopleIcon, text: 'Acude 10 minutos antes para conocer el equipo y ajustarlo a tu medida.' },
  { Icon: ShirtIcon, text: 'Ropa deportiva y tenis sin plataforma — el equipo lo ponemos nosotros.' },
];

export default function GrandOpening() {
  return (
    <section className="opening" id="apertura">
      <div className="opening-bg" aria-hidden="true" />
      <div className="opening-overlay" aria-hidden="true" />

      <div className="container opening-grid">
        {/* Columna izquierda — hero */}
        <div className="opening-hero">
          <div className="opening-badges">
            <span className="opening-badge opening-badge--teal">
              <StarIcon size={13} /> Evento especial
            </span>
            <span className="opening-badge opening-badge--red">
              <TicketIcon size={14} /> Cupo limitado
            </span>
          </div>

          <h2 className="opening-title">
            <span className="opening-title-1">Gran</span>
            <span className="opening-title-2">Apertura</span>
          </h2>

          <p className="opening-script">¡Ya abrimos!</p>

          <p className="opening-invite">
            <strong>¡Hoy es el día!</strong> Sábado 8 de agosto la clase es <strong>gratuita</strong> por hora. Las reservas en línea con costo ya están disponibles del <strong>10 de agosto</strong> en adelante.
          </p>

          <div className="opening-gift">
            <span className="opening-gift-icon"><GiftIcon size={22} /></span>
            <p>Ven y vive la experiencia que <strong>transformará tu energía.</strong></p>
          </div>
        </div>

        {/* Columna derecha — panel de detalles */}
        <div className="opening-panel">
          <div className="opening-facts">
            {facts.map((f) => (
              <div key={f.label} className="opening-fact">
                <span className="opening-fact-icon"><f.Icon size={20} /></span>
                <div>
                  <span className="opening-fact-label">{f.label}</span>
                  <strong>{f.value}</strong>
                </div>
              </div>
            ))}
          </div>

          <h3 className="opening-includes-title">¿Qué incluye tu visita?</h3>
          <ul className="opening-includes">
            {includes.map((it) => (
              <li key={it.text}>
                <span className="opening-includes-icon"><it.Icon size={18} /></span>
                <span>{it.text}</span>
              </li>
            ))}
          </ul>

          <div className="opening-actions">
            <a href="#horarios" className="btn opening-btn-primary">
              <BoltIcon size={16} /> Reservar mi lugar <ArrowRight size={16} />
            </a>
            <a href="#horarios" className="btn opening-btn-ghost">
              <CalendarDaysIcon size={16} /> Ver horarios
            </a>
          </div>

          <div className="opening-note">
            <PeopleIcon size={18} />
            <p>
              <strong>Cupos limitados por horario</strong>
              <span className="opening-note-warn">¡No te quedes fuera!</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
