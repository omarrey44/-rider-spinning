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

export default function BikeSelector({ selectedSlot, onCheckout }: BikeSelectorProps) {
  const [selectedBike, setSelectedBike] = useState<number | null>(null);
  const [tooltipBike, setTooltipBike] = useState<number | null>(null);
  const totalBikes = BIKE_CONFIG.rows * BIKE_CONFIG.cols;

  const handleBikeClick = (num: number) => {
    if (BIKE_CONFIG.taken.includes(num)) return;
    setSelectedBike(num);
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
              <div className="summary-detail">
                <div>
                  <h4>Bike #{String(selectedBike).padStart(2, '0')}</h4>
                  <p style={{ color: 'var(--red-primary)', fontWeight: 600, fontSize: '13px' }}>
                    Primero selecciona una clase en horarios
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '24px' }}>—</strong>
                </div>
              </div>
            ) : (
              <div className="summary-detail">
                <div>
                  <h4>Bike #{String(selectedBike).padStart(2, '0')}</h4>
                  <p>
                    Fila {Math.ceil(selectedBike / BIKE_CONFIG.cols)}{' '}
                    {BIKE_CONFIG.popular.includes(selectedBike) && (
                      <>· <span style={{ color: 'var(--red-primary)' }}>Posición popular</span></>
                    )}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedSlot.className} · {selectedSlot.instructorName} · {selectedSlot.hour} {selectedSlot.period}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '24px' }}>{selectedSlot.price}</strong>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: '8px', display: 'inline-flex', cursor: 'pointer' }}
                    onClick={handleCheckout}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bike-room">
          {/* Mejora 1 + 4: Instructor dinámico con avatar */}
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

          {/* Mejora 2: Banner de detalles de clase */}
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

          <div className="bike-grid">
            {Array.from({ length: totalBikes }, (_, i) => i + 1).map((num) => {
              const taken = BIKE_CONFIG.taken.includes(num);
              const popular = BIKE_CONFIG.popular.includes(num);
              const selected = selectedBike === num;
              const tooltip = getBikeTooltip(num);
              const cls = ['bike-cell', taken && 'taken', popular && !selected && 'popular', selected && 'selected'].filter(Boolean).join(' ');
              return (
                <div
                  key={num}
                  className="bike-cell-wrapper"
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
                    {num}
                  </button>
                  {/* Mejora 3: Tooltip para bikes populares */}
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
