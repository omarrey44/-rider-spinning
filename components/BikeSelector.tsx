import { useState } from 'react';
import { BIKE_CONFIG } from '@/data/schedule';

interface BikeSelectorProps {
  selectedSlot: {
    className: string;
    instructorName: string;
    hour: string;
    period: string;
    price: string;
  } | null;
  onCheckout: (bikeNumber: number, bikeRow: number) => void;
}

export default function BikeSelector({ selectedSlot, onCheckout }: BikeSelectorProps) {
  const [selectedBike, setSelectedBike] = useState<number | null>(null);
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
          <div className="instructor-stage"><span>INSTRUCTOR</span></div>
          <div className="bike-grid">
            {Array.from({ length: totalBikes }, (_, i) => i + 1).map((num) => {
              const taken = BIKE_CONFIG.taken.includes(num);
              const popular = BIKE_CONFIG.popular.includes(num);
              const selected = selectedBike === num;
              const cls = ['bike-cell', taken && 'taken', popular && !selected && 'popular', selected && 'selected'].filter(Boolean).join(' ');
              return (
                <button
                  key={num}
                  className={cls}
                  disabled={taken}
                  aria-label={taken ? `Bicicleta ${num}, ocupada` : `Bicicleta ${num}`}
                  aria-pressed={selected}
                  onClick={() => handleBikeClick(num)}
                >
                  {num}
                </button>
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
