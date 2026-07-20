import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BIKE_CONFIG } from '@/data/schedule';
import { BoltIcon, UserIcon, CalendarIcon, CalendarDaysIcon, AlarmClockIcon, StopwatchIcon, FanIcon, EyeIcon, StarIcon } from './Icons';

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
    isFree?: boolean;
  } | null;
  onCheckout: (bikeNumber: number, bikeRow: number) => void;
  hideHeader?: boolean;
  compact?: boolean;
}

/* Filas del salón derivadas de BIKE_CONFIG.rowConfig — [inicio, fin] por fila.
   Fila 1 (frente al instructor, más lejos de la cámara) se renderiza más chica;
   Fila 2 (atrás, más cerca de la cámara) más grande. Perspectiva 3/4 trasera. */
function getRowRanges(): { start: number; end: number }[] {
  let cursor = 1;
  return BIKE_CONFIG.rowConfig.map((count) => {
    const start = cursor;
    const end = cursor + count - 1;
    cursor = end + 1;
    return { start, end };
  });
}
const ROW_RANGES = getRowRanges();

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 6H10V4.5C10 3.12 8.88 2 7.5 2S5 3.12 5 4.5V6H4C3.45 6 3 6.45 3 7V11C3 11.55 3.45 12 4 12H11C11.55 12 12 11.55 12 11V7C12 6.45 11.55 6 11 6ZM7.5 9.5C6.67 9.5 6 8.83 6 8S6.67 6.5 7.5 6.5 9 7.17 9 8 8.33 9.5 7.5 9.5ZM9 6H6V4.5C6 3.67 6.67 3 7.5 3S9 3.67 9 4.5V6Z"/>
    </svg>
  );
}

function getBikePosition(num: number): { row: number; col: number; rowCount: number } {
  const { rowConfig } = BIKE_CONFIG;
  let count = 0;
  for (let r = 0; r < rowConfig.length; r++) {
    if (num <= count + rowConfig[r]) {
      return { row: r + 1, col: num - count, rowCount: rowConfig[r] };
    }
    count += rowConfig[r];
  }
  return { row: rowConfig.length, col: 1, rowCount: rowConfig[rowConfig.length - 1] };
}

export default function BikeSelector({ selectedSlot, onCheckout, hideHeader, compact }: BikeSelectorProps) {
  const [selectedBike, setSelectedBike] = useState<number | null>(null);
  const [takenBikes, setTakenBikes] = useState<number[]>([]);
  const [isLoadingBikes, setIsLoadingBikes] = useState(false);
  const [bikesError, setBikesError] = useState(false);
  const totalBikes = BIKE_CONFIG.total;
  const bikeRoomRef = useRef<HTMLDivElement>(null);

  // On mobile or compact (modal) mode, scroll the checkout bar into view after bike selection.
  useEffect(() => {
    if (selectedBike === null || typeof window === 'undefined') return;
    if (!compact && window.innerWidth > 768) return;
    const timer = setTimeout(() => {
      const bar = document.querySelector('.sticky-checkout-bar') as HTMLElement | null;
      if (!bar) return;
      if (compact) {
        const modal = bar.closest('.modal') as HTMLElement | null;
        if (modal) modal.scrollTop = modal.scrollHeight + 200;
      } else {
        bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedBike, compact]);

  useEffect(() => {
    if (!selectedSlot) {
      setTakenBikes([]);
      setBikesError(false);
      return;
    }

    let cancelled = false;

    const fetchTakenBikes = async () => {
      setIsLoadingBikes(true);
      setBikesError(false);
      try {
        const params = new URLSearchParams({
          class_title: selectedSlot.className,
          day: selectedSlot.dayName,
          hour: `${selectedSlot.hour} ${selectedSlot.period}`,
        });
        const res = await fetch(`/api/bookings/available-bikes?${params}`);
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        if (cancelled) return;
        setTakenBikes(data.takenBikes || []);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching taken bikes:', err);
        // No asumir disponibilidad en error — el usuario podría reservar una bici ya ocupada
        setBikesError(true);
      } finally {
        if (!cancelled) setIsLoadingBikes(false);
      }
    };

    fetchTakenBikes();
    return () => { cancelled = true; };
  }, [selectedSlot]);

  const availableCount = totalBikes - takenBikes.length;

  // Solo resetear bici si está ocupada en nueva clase. Si sigue disponible, mantener selección.
  useEffect(() => {
    if (selectedBike !== null && takenBikes.includes(selectedBike)) {
      setSelectedBike(null);
    }
  }, [takenBikes, selectedBike]);

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
    if (isLoadingBikes || bikesError || takenBikes.includes(num)) return;
    setSelectedBike(num);
  };

  const handleCheckout = () => {
    if (selectedBike !== null) {
      const { row } = getBikePosition(selectedBike);
      onCheckout(selectedBike, row);
    }
  };

  // Tooltip por fila — todas las bicis libres reciben contexto
  const getBikeTooltip = (num: number) => {
    if (takenBikes.includes(num)) return null;
    const { row } = getBikePosition(num);
    const isPopular = BIKE_CONFIG.popular.includes(num);
    if (row === 1) return isPopular
      ? 'Fila 1 · Principiantes · Posición popular ⭐'
      : 'Fila 1 · Principiantes · Frente al instructor';
    if (row === 2) return isPopular
      ? 'Fila 2 · Centro · Posición popular ⭐'
      : 'Fila 2 · Espacio amplio · Cerca de salida';
    return null;
  };

  // Estado del step indicator
  const stepClass = selectedSlot ? 'completed' : 'active';
  const stepBike = selectedSlot ? (selectedBike ? 'completed' : 'active') : (selectedBike ? 'active' : 'pending');
  const stepPay = selectedSlot && selectedBike ? 'active' : 'pending';

  return (
    <section className={`bike-selector${compact ? ' bike-selector--compact' : ''}`} id="reservar">
      {!hideHeader && (
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
              <span className="step-label">{selectedSlot?.isFree ? 'Confirmar' : 'Pago'}</span>
            </li>
          </ol>
        </div>
      )}
      <div className="container bike-layout">
        <div className="bike-info">
          <span className="eyebrow">Selecciona tu lugar</span>
          <div className="bike-header-with-stock">
            <h2>Tu bici, <span className="text-red">tu posición</span></h2>
            {selectedSlot && (
              <div className="stock-indicator">
                {availableCount > 0 ? (
                  <span className="stock-badge available">🟢 {availableCount} disponibles</span>
                ) : (
                  <span className="stock-badge sold-out">⚠️ Sin disponibilidad</span>
                )}
              </div>
            )}
          </div>
          <p>Vista del salón en tiempo real. Las primeras filas tienen mejor visibilidad del instructor; las laterales reciben más aire.</p>

          <div className="bike-summary">
            {!selectedSlot ? (
              <p className="summary-empty summary-empty-noclass">
                Elige tu clase primero
              </p>
            ) : availableCount === 0 ? (
              <div className="summary-full">
                <p className="summary-full-title">😔 Clase llena</p>
                <p className="summary-full-sub">Todos los lugares están ocupados para este horario.</p>
                <p className="summary-full-sub">Revisa otro día u horario — nuevos lugares se liberan cuando alguien cancela.</p>
              </div>
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
                    {selectedSlot.isFree ? 'Reservar gratis' : 'Confirmar reserva'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div ref={bikeRoomRef} className={`bike-room ${!selectedSlot ? 'bike-room-locked' : ''}`}>
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

          {/* Class info banner */}
          {selectedSlot && (
            <div className="class-info-banner">
              <div className="class-info-item class-info-item--date">
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
                  <span className="class-info-value">{selectedSlot.price}</span>
                </div>
              </div>
            </div>
          )}

          {/* Leyenda dentro del panel — como la referencia */}
          <ul className="bike-legend bike-legend--room" aria-label="Leyenda de estados">
            <li><span className="dot dot-free"></span> Disponible</li>
            <li><span className="dot dot-selected"></span> Tu selección</li>
            <li><span className="dot dot-taken"></span> Ocupada</li>
            <li><span className="dot dot-popular"></span> Popular</li>
          </ul>

          {/* Counter de disponibilidad */}
          {selectedSlot && bikesError ? (
            <div className="availability-counter critical" role="alert">
              <span className="availability-dot" aria-hidden="true"></span>
              No se pudo verificar disponibilidad — intenta de nuevo
            </div>
          ) : selectedSlot && !isLoadingBikes && (
            <div
              className={`availability-counter ${availableCount <= 3 ? 'critical' : availableCount <= 5 ? 'low' : ''}`}
              role="status"
              aria-live="polite"
            >
              <span className="availability-dot" aria-hidden="true"></span>
              <strong>{availableCount}</strong> de {totalBikes} disponibles
              {availableCount <= 5 && <span className="availability-warn">{availableCount <= 3 ? '⚠️ ¡Últimos lugares!' : '⚡ Pocos lugares'}</span>}
            </div>
          )}

          {/* Cinematic 3D Studio */}
          <div className="studio-scene">
            {/* Atmospheric floor plane */}
            <div className="studio-floor-bg" aria-hidden="true" />
            <div className="stage-beam" aria-hidden="true" />

            {/* Instructor platform — neon pedestal con bici 3D centrada */}
            <div className="studio-instructor-area">
              <p className="s3d-instructor-label" aria-hidden="true">INSTRUCTOR</p>
              <div className="s3d-stage-wrap" aria-hidden="true">
                <div className="s3d-beam-l" />
                <div className="s3d-beam-r" />
                <div className="s3d-platform">
                  <img
                    src="/Instructor-Bike.png"
                    alt=""
                    className="s3d-platform-bike"
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Row labels — absolutely positioned left */}
            <div className="s3d-row-labels" aria-hidden="true">
              <div className="s3d-rl s3d-rl--1"><span className="s3d-fila">FILA 1</span><span className="s3d-desc">Principiantes</span></div>
              <div className="s3d-rl s3d-rl--2"><span className="s3d-fila">FILA 2</span><span className="s3d-desc">Más espacio</span></div>
            </div>

            {/* Mobile-only row strips — labels above each row */}
            <div className="s3d-mobile-rows" aria-hidden="true">
              <div className="s3d-mrow s3d-mrow--1">
                <span className="s3d-mfila">FILA 1 · Principiantes</span>
                <span className="s3d-mperk"><EyeIcon size={12} />Mejor vista</span>
              </div>
              <div className="s3d-mrow s3d-mrow--2">
                <span className="s3d-mfila">FILA 2 · Más espacio</span>
                <span className="s3d-mperk"><StarIcon size={12} />Popular</span>
              </div>
            </div>

            {/* Iso 3D floor — 2 filas en perspectiva, misma bici 3/4 trasera reutilizada */}
            <div className="s3d-floor">
              {ROW_RANGES.map(({ start, end }, rowIdx) => (
                <div key={rowIdx} className={`s3d-row s3d-row--${rowIdx + 1}`}>
                  {Array.from({ length: end - start + 1 }, (_, i) => {
                    const num = start + i;
                    const row = rowIdx + 1;
                    const count = end - start + 1;
                    const taken = takenBikes.includes(num);
                    const pending = isLoadingBikes || bikesError;
                    const popular = BIKE_CONFIG.popular.includes(num);
                    const selected = selectedBike === num;
                    const tooltip = getBikeTooltip(num);
                    /* Lado derecho de la fila volteado — todas miran al instructor */
                    const flip = i + 1 > Math.ceil(count / 2);
                    const cls = [
                      'b3d',
                      `b3d--row${row}`,
                      flip && 'b3d--flip',
                      taken && 'b3d--taken',
                      pending && !taken && 'b3d--pending',
                      popular && !taken && !selected && 'b3d--popular',
                      selected && 'b3d--selected',
                    ].filter(Boolean).join(' ');
                    const isDisabled = taken || pending;

                    return (
                      <motion.button
                        key={num}
                        className={cls}
                        disabled={isDisabled}
                        title={taken ? `Bicicleta ${num} - Ocupada` : pending ? `Bicicleta ${num} - Verificando disponibilidad` : tooltip || `Bicicleta ${num}`}
                        aria-label={taken ? `Bicicleta ${num}, ocupada` : pending ? `Bicicleta ${num}, verificando disponibilidad` : `Bicicleta ${num}`}
                        aria-pressed={selected}
                        onClick={() => handleBikeClick(num)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: selected ? 1.05 : 1,
                          rotate: selected ? 2.5 : 0,
                        }}
                        transition={{ delay: num * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
                        whileHover={isDisabled ? undefined : { y: -5, scale: selected ? 1.05 : 1.04 }}
                        whileTap={isDisabled ? undefined : { scale: 0.97 }}
                      >
                        <img
                          src="/bike-3d.png"
                          alt=""
                          className="b3d-img"
                          draggable={false}
                        />
                        <div className="b3d-platform" aria-hidden="true">
                          <span className="b3d-num">{String(num).padStart(2, '0')}</span>
                        </div>
                        <div className="b3d-glow" aria-hidden="true" />
                        {taken && <LockIcon className="b3d-lock" />}
                        {popular && !taken && <span className="b3d-star" aria-hidden="true">★</span>}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Icons — right */}
            <div className="s3d-icons" aria-hidden="true">
              <div className="s3d-icon"><EyeIcon size={15} /><span>Mejor vista</span></div>
              <div className="s3d-icon"><FanIcon size={15} /><span>Más aire</span></div>
            </div>

            <p className="s3d-bottom" aria-hidden="true">↓ FONDO · SALIDA</p>
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
            Continuar reserva →
          </button>
        </div>
      )}
    </section>
  );
}
