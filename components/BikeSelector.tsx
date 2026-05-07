import { useState } from 'react';
import { BIKE_CONFIG } from '@/data/schedule';

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

  const scrollToHorarios = () => {
    const el = document.getElementById('horarios');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBikeClick = (num: number) => {
    if (BIKE_CONFIG.taken.includes(num)) return;
    setSelectedBike(num);
    // Si no hay clase seleccionada, guiar al usuario hacia horarios
    if (!selectedSlot) {
      setTimeout(scrollToHorarios, 400);
    }
  };

  const handleCheckout = () => {
    if (selectedBike !== null) {
      const bikeRow = Math.ceil(selectedBike / BIKE_CONFIG.cols);
      onCheckout(selectedBike, bikeRow);
    }
  };

  const getBikeTooltip = (num: number) => {
    const isPopular = BIKE_CONFIG.popular.includes(num);
    if (!isPopular) return null;
    const col = ((num - 1) % BIKE_CONFIG.cols) + 1;
    if (col === 3 || col === 4) return 'Centro del salón — mejor visibilidad del instructor';
    return 'Frente del salón — mayor energía';
  };

  return (
    <section className="bike-selector" id="reservar">
      <div className="container bike-layout">
        <div className="bike-info">
          <span className="eyebrow">Selecciona tu lugar</span>
          <h2>Tu bici, <span className="text-red">tu posición.</span></h2>
          <p>Vista del salón en tiempo real. Las primeras filas tienen mejor visibilidad del instructor; las laterales reciben más aire.</p>

          <ul className="bike-legend">
            <li><span className="dot dot-free"></span> Disponible</li>
            <li><span className="dot dot-selected"></span> Tu selección</li>
            <li><span className="dot dot-taken"></span> Ocupada</li>
            <li><span className="dot dot-popular"></span> Popular</li>
          </ul>

          <div className="bike-summary">
            {selectedBike === null ? (
              <p className="summary-empty">Selecciona una bici para continuar</p>
            ) : !selectedSlot ? (
              <div className="summary-no-class">
                <div className="summary-bike-confirmed">
                  <div className="check-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h4>Bicicleta #{String(selectedBike).padStart(2, '0')} seleccionada</h4>
                  <p className="summary-position">
                    Fila {Math.ceil(selectedBike / BIKE_CONFIG.cols)}
                    {BIKE_CONFIG.popular.includes(selectedBike) && (
                      <span className="tag-popular">Posición popular</span>
                    )}
                  </p>
                </div>
                <div className="summary-next-step">
                  <p>Ahora elige tu clase para completar la reserva</p>
                  <button
                    className="btn btn-outline btn-scroll-horarios"
                    onClick={scrollToHorarios}
                    style={{ cursor: 'pointer' }}
                  >
                    Ver horarios disponibles
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6l5 5 5-5" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="summary-detail">
                <div className="summary-confirmed-block">
                  <div className="check-circle check-green">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h4>Has seleccionado la bicicleta #{String(selectedBike).padStart(2, '0')}</h4>
                  <p className="summary-position">
                    Fila {Math.ceil(selectedBike / BIKE_CONFIG.cols)}
                    {BIKE_CONFIG.popular.includes(selectedBike) && (
                      <span className="tag-popular">· Posición popular</span>
                    )}
                  </p>
                </div>
                <div className="summary-class-block">
                  <p className="class-detail-line">
                    <span className="detail-icon">🏋️</span>
                    <span className="detail-label">Clase</span>
                    <strong>{selectedSlot.className}</strong>
                  </p>
                  <p className="class-detail-line">
                    <span className="detail-icon">🧑‍🏫</span>
                    <span className="detail-label">Instructor</span>
                    <strong>{selectedSlot.instructorName}</strong>
                  </p>
                  <p className="class-detail-line">
                    <span className="detail-icon">📆</span>
                    <span className="detail-label">{selectedSlot.dayName}</span>
                    <strong>{selectedSlot.date} · {selectedSlot.hour} {selectedSlot.period}</strong>
                  </p>
                  <p className="class-detail-line">
                    <span className="detail-icon">⏱</span>
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

        <div className="bike-room">
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
                <span className="class-info-icon">📆</span>
                <div>
                  <span className="class-info-label">Día</span>
                  <span className="class-info-value">{selectedSlot.dayName}</span>
                </div>
              </div>
              <div className="class-info-divider"></div>
              <div className="class-info-item">
                <span className="class-info-icon">🗓</span>
                <div>
                  <span className="class-info-label">Fecha</span>
                  <span className="class-info-value">{selectedSlot.date}</span>
                </div>
              </div>
              <div className="class-info-divider"></div>
              <div className="class-info-item">
                <span className="class-info-icon">⏰</span>
                <div>
                  <span className="class-info-label">Horario</span>
                  <span className="class-info-value">{selectedSlot.hour} {selectedSlot.period}</span>
                </div>
              </div>
              <div className="class-info-divider"></div>
              <div className="class-info-item">
                <span className="class-info-icon">⏱</span>
                <div>
                  <span className="class-info-label">Duración</span>
                  <span className="class-info-value">{selectedSlot.duration}</span>
                </div>
              </div>
            </div>
          )}

          {/* Arc grid de bicis */}
          <div className="bike-grid">
            {Array.from({ length: totalBikes }, (_, i) => i + 1).map((num) => {
              const taken = BIKE_CONFIG.taken.includes(num);
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
          <div className="room-extras">
            <span className="extra fan-left">🌀 ventilador</span>
            <span className="extra fan-right">🌀 ventilador</span>
          </div>
        </div>
      </div>
    </section>
  );
}
