import { useState, useMemo } from 'react';
import { BIKE_CONFIG, getTakenBikes } from '@/data/schedule';
import { BoltIcon, UserIcon, CalendarIcon, CalendarDaysIcon, AlarmClockIcon, StopwatchIcon, FanIcon } from './Icons';

interface BikeSelectorProps {
  selectedSlot: {
    className: string;
    instructorName: string;
    hour: string;
    period: string;
    price: string;
    duration: string;
    instructorClass: string;
    dayName: string;
    date: string;
    fullDateTime: string;
  } | null;
  onCheckout: (bikeNumber: number, bikeRow: number) => void;
}

/* SVG inline de silueta de bici spinning (vista lateral) */
function BikeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rueda trasera */}
      <circle cx="12" cy="30" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.6"/>
      <circle cx="12" cy="30" r="1" fill="currentColor" opacity="0.4"/>
      {/* Rueda delantera */}
      <circle cx="36" cy="30" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.6"/>
      <circle cx="36" cy="30" r="1" fill="currentColor" opacity="0.4"/>
      {/* Cuadro principal — triángulo */}
      <path d="M12 30 L20 18 L30 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Tubo horizontal superior */}
      <path d="M20 18 L32 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Horquilla delantera */}
      <path d="M32 18 L36 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Tija del sillín */}
      <path d="M20 18 L18 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Sillín */}
      <rect x="14" y="10" width="9" height="2.5" rx="1.25" fill="currentColor" opacity="0.7"/>
      {/* Potencia / manubrio */}
      <path d="M32 18 L34 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Manubrio */}
      <path d="M30 12 L38 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Pedalier / eje central */}
      <circle cx="20" cy="30" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
      {/* Pedales */}
      <rect x="17" y="33" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.4"/>
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 6H10V4.5C10 3.12 8.88 2 7.5 2S5 3.12 5 4.5V6H4C3.45 6 3 6.45 3 7V11C3 11.55 3.45 12 4 12H11C11.55 12 12 11.55 12 11V7C12 6.45 11.55 6 11 6ZM7.5 9.5C6.67 9.5 6 8.83 6 8S6.67 6.5 7.5 6.5 9 7.17 9 8 8.33 9.5 7.5 9.5ZM9 6H6V4.5C6 3.67 6.67 3 7.5 3S9 3.67 9 4.5V6Z"/>
    </svg>
  );
}

export default function BikeSelector({ selectedSlot, onCheckout }: BikeSelectorProps) {
  const [selectedBike, setSelectedBike] = useState<number | null>(null);
  const [tooltipBike, setTooltipBike] = useState<number | null>(null);
  const totalBikes = BIKE_CONFIG.rows * BIKE_CONFIG.cols;

  // Bicis ocupadas: derivadas del slot seleccionado para que cada clase
  // tenga su propio patrón. Se reemplazará por query a Supabase cuando
  // tengamos realtime de bookings.
  const takenBikes = useMemo(() => {
    if (!selectedSlot) return [] as number[];
    return getTakenBikes(`${selectedSlot.className}-${selectedSlot.dayName}-${selectedSlot.hour}`);
  }, [selectedSlot]);

  const availableCount = totalBikes - takenBikes.length;

  // Solo resetear bici si está ocupada en nueva clase. Si sigue disponible, mantener selección.
  if (selectedBike !== null && takenBikes.includes(selectedBike)) {
    setSelectedBike(null);
  }

  const scrollToHorarios = () => {
    const el = document.getElementById('horarios');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBikeClick = (num: number) => {
    // Sin clase seleccionada: la sala está bloqueada — redirigir al schedule
    if (!selectedSlot) {
      scrollToHorarios();
      return;
    }
    if (takenBikes.includes(num)) return;
    setSelectedBike(num);
  };

  const handleCheckout = () => {
    if (selectedBike !== null) {
      const bikeRow = Math.ceil(selectedBike / BIKE_CONFIG.cols);
      onCheckout(selectedBike, bikeRow);
    }
  };

  // Tooltip por fila — todas las bicis libres reciben contexto
  const getBikeTooltip = (num: number) => {
    if (takenBikes.includes(num)) return null;
    const row = Math.ceil(num / BIKE_CONFIG.cols);
    const isPopular = BIKE_CONFIG.popular.includes(num);
    if (row === 1) return 'Fila 1 · Frente al instructor · Más energía';
    if (row === 2) return isPopular
      ? 'Fila 2 · Centro · Posición popular ⭐'
      : 'Fila 2 · Centro · Visibilidad balanceada';
    if (row === 3) return 'Fila 3 · Espacio amplio · Cerca de salida';
    return null;
  };

  // Estado del step indicator
  const stepClass = selectedSlot ? 'completed' : 'active';
  const stepBike = selectedSlot ? (selectedBike ? 'completed' : 'active') : (selectedBike ? 'active' : 'pending');
  const stepPay = selectedSlot && selectedBike ? 'active' : 'pending';

  return (
    <section className="bike-selector" id="reservar">
      <div className="container">
        {/* Step indicator del flujo de reserva */}
        <ol className="step-indicator" aria-label="Pasos de la reserva">
          <li className={`step step-${stepClass}`}>
            <span className="step-num">1</span>
            <span className="step-label">Clase</span>
          </li>
          <li className="step-line" aria-hidden="true"></li>
          <li className={`step step-${stepBike}`}>
            <span className="step-num">2</span>
            <span className="step-label">Bici</span>
          </li>
          <li className="step-line" aria-hidden="true"></li>
          <li className={`step step-${stepPay}`}>
            <span className="step-num">3</span>
            <span className="step-label">Pago</span>
          </li>
        </ol>
      </div>
      <div className="container bike-layout">
        <div className="bike-info">
          <span className="eyebrow">Selecciona tu lugar</span>
          <h2>Tu bici, <span className="text-red">tu posición</span></h2>
          <p>Vista del salón en tiempo real. Las primeras filas tienen mejor visibilidad del instructor; las laterales reciben más aire.</p>

          <ul className="bike-legend">
            <li><span className="dot dot-free"></span> Disponible</li>
            <li><span className="dot dot-selected"></span> Tu selección</li>
            <li><span className="dot dot-taken"></span> Ocupada</li>
            <li><span className="dot dot-popular"></span> Popular</li>
          </ul>

          <div className="bike-summary">
            {!selectedSlot ? (
              <p className="summary-empty summary-empty-noclass">
                Elige tu clase primero
              </p>
            ) : selectedBike === null ? (
              <p className="summary-empty">Selecciona una bici para continuar</p>
            ) : (
              <div className="summary-detail">
                <div className="summary-confirmed-block">
                  <div className="check-circle check-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h4>Bicicleta #{String(selectedBike).padStart(2, '0')} seleccionada</h4>
                  <p className="summary-position">
                    {getBikeTooltip(selectedBike)}
                  </p>
                  <button
                    type="button"
                    className="change-bike-btn"
                    onClick={() => setSelectedBike(null)}
                    aria-label="Cambiar selección de bici"
                  >
                    Cambiar bici
                  </button>
                </div>
                <div className="summary-class-block">
                  <p className="class-detail-line">
                    <span className="detail-icon"><BoltIcon /></span>
                    <span className="detail-label">Clase</span>
                    <strong>{selectedSlot.className}</strong>
                  </p>
                  <p className="class-detail-line">
                    <span className="detail-icon"><UserIcon /></span>
                    <span className="detail-label">Instructor</span>
                    <strong>{selectedSlot.instructorName}</strong>
                  </p>
                  <p className="class-detail-line">
                    <span className="detail-icon"><CalendarIcon /></span>
                    <span className="detail-label">Fecha</span>
                    <strong>{selectedSlot.fullDateTime}</strong>
                  </p>
                  <p className="class-detail-line">
                    <span className="detail-icon"><StopwatchIcon /></span>
                    <span className="detail-label">Duración</span>
                    <strong>{selectedSlot.duration}</strong>
                  </p>
                </div>
                <div className="summary-price-confirm">
                  <strong className="summary-price">{selectedSlot.price}</strong>
                  <button
                    className="btn btn-primary btn-confirm-reservation"
                    onClick={handleCheckout}
                  >
                    Confirmar reserva
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`bike-room ${!selectedSlot ? 'bike-room-locked' : ''}`}>
          {/* Overlay cuando no hay clase: la sala se ve pero está bloqueada */}
          {!selectedSlot && (
            <div className="bike-room-locked-overlay">
              <div className="locked-icon-wrap" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h4 className="locked-title">Sala bloqueada</h4>
              <p className="locked-subtitle">Elige una clase primero para activar tu lugar</p>
              <button
                type="button"
                className="btn btn-primary locked-cta"
                onClick={scrollToHorarios}
              >
                ↑ Ver horarios
              </button>
            </div>
          )}

          {/* Instructor position */}
          {selectedSlot ? (
            <div className="instructor-stage instructor-stage-active">
              <span className={`avatar-instructor ${selectedSlot.instructorClass}`}></span>
              <div className="instructor-stage-text">
                <span className="instructor-stage-label">CLASE CON</span>
                <span className="instructor-stage-name">{selectedSlot.instructorName.toUpperCase()}</span>
              </div>
            </div>
          ) : (
            <div className="instructor-stage"><span>INSTRUCTOR</span></div>
          )}

          {/* Class info banner */}
          {selectedSlot && (
            <div className="class-info-banner">
              <div className="class-info-item">
                <span className="class-info-icon"><CalendarDaysIcon /></span>
                <div>
                  <span className="class-info-label">Día</span>
                  <span className="class-info-value">{selectedSlot.dayName} · {selectedSlot.date}</span>
                </div>
              </div>
              <div className="class-info-divider"></div>
              <div className="class-info-item">
                <span className="class-info-icon"><AlarmClockIcon /></span>
                <div>
                  <span className="class-info-label">Horario</span>
                  <span className="class-info-value">{selectedSlot.hour} {selectedSlot.period}</span>
                </div>
              </div>
              <div className="class-info-divider"></div>
              <div className="class-info-item">
                <span className="class-info-icon"><StopwatchIcon /></span>
                <div>
                  <span className="class-info-label">Duración</span>
                  <span className="class-info-value">{selectedSlot.duration}</span>
                </div>
              </div>
              <div className="class-info-divider"></div>
              <div className="class-info-item class-info-item--price">
                <div>
                  <span className="class-info-label">Precio</span>
                  <span className="class-info-value">{selectedSlot.price} <small>MXN</small></span>
                </div>
              </div>
            </div>
          )}

          {/* Counter de disponibilidad */}
          {selectedSlot && (
            <div className={`availability-counter ${availableCount <= 5 ? 'low' : ''}`}>
              <span className="availability-dot" aria-hidden="true"></span>
              <strong>{availableCount}</strong> de {totalBikes} disponibles
              {availableCount <= 5 && <span className="availability-warn">¡Pocos lugares!</span>}
            </div>
          )}

          {/* Indicador de orientación: frente */}
          <div className="room-orientation room-orientation-front" aria-hidden="true">
            <span className="orientation-arrow">↑</span> Frente
          </div>

          {/* Arc grid de bicis con labels de fila */}
          <div className="bike-grid-wrap">
            <div className="row-labels" aria-hidden="true">
              <span>FILA 1</span>
              <span>FILA 2</span>
              <span>FILA 3</span>
            </div>
            <div className="bike-grid">
            {Array.from({ length: totalBikes }, (_, i) => i + 1).map((num) => {
              const taken = takenBikes.includes(num);
              const popular = BIKE_CONFIG.popular.includes(num);
              const selected = selectedBike === num;
              const tooltip = getBikeTooltip(num);
              const col = ((num - 1) % BIKE_CONFIG.cols) + 1;
              // Arc spread: -30° to +30° across columns
              const arcAngle = ((col - 1) / (BIKE_CONFIG.cols - 1) - 0.5) * 60;
              const cls = [
                'bike-node',
                taken && 'taken',
                popular && !selected && 'popular',
                selected && 'selected',
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={num}
                  className="bike-node-wrapper"
                  style={{ '--bike-arc': `${arcAngle}deg` } as React.CSSProperties}
                  onMouseEnter={() => tooltip && setTooltipBike(num)}
                  onMouseLeave={() => setTooltipBike(null)}
                >
                  <button
                    className={cls}
                    disabled={taken}
                    title={taken ? `Bicicleta ${num} - Ocupada` : `Bicicleta ${num}${tooltip ? ' - ' + tooltip : ''}`}
                    aria-label={taken ? `Bicicleta ${num}, ocupada` : `Bicicleta ${num}${tooltip ? ', popular: ' + tooltip : ''}`}
                    aria-pressed={selected}
                    onClick={() => handleBikeClick(num)}
                  >
                    <BikeIcon className="bike-icon-svg" />
                    <span className="bike-num">{num}</span>
                    {taken && <LockIcon className="bike-lock" />}
                  </button>
                  {/* Tooltip for popular bikes */}
                  {tooltip && tooltipBike === num && (
                    <div className="bike-tooltip">{tooltip}</div>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Indicador de orientación: fondo */}
          <div className="room-orientation room-orientation-back" aria-hidden="true">
            <span className="orientation-arrow">↓</span> Fondo · Salida
          </div>

          <div className="room-extras">
            <span className="extra fan-left"><FanIcon /> ventilador</span>
            <span className="extra fan-right"><FanIcon /> ventilador</span>
          </div>
        </div>
      </div>

      {/* Sticky CTA bar para mobile cuando ya se eligió clase + bici */}
      {selectedSlot && selectedBike !== null && (
        <div className="sticky-checkout-bar" role="region" aria-label="Tu reserva">
          <div className="sticky-checkout-info">
            <span className="sticky-bike">#{String(selectedBike).padStart(2, '0')}</span>
            <div className="sticky-text">
              <span className="sticky-class">{selectedSlot.className}</span>
              <span className="sticky-position">{getBikeTooltip(selectedBike)}</span>
              <span className="sticky-meta">{selectedSlot.hour} {selectedSlot.period} · {selectedSlot.price}</span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary sticky-checkout-cta"
            onClick={handleCheckout}
          >
            Continuar
          </button>
        </div>
      )}
    </section>
  );
}
