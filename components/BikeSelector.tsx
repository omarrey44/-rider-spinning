'use client';

import { useState, useEffect, useRef } from 'react';
import BikeRoom from './BikeRoom';
import { useBikeAvailability } from '@/hooks/useBikeAvailability';
import { BIKE_CONFIG } from '@/data/schedule';
import { BoltIcon, UserIcon, CalendarIcon, CalendarDaysIcon, AlarmClockIcon, StopwatchIcon } from './Icons';

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
    dateISO?: string;
    fullDateTime: string;
    isFree?: boolean;
  } | null;
  onCheckout: (bikeNumber: number, bikeRow: number) => void;
  hideHeader?: boolean;
  compact?: boolean;
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
  const [selection, setSelection] = useState<{ slotKey: string; bike: number } | null>(null);
  const { slotKey, status, takenBikes, availableCount, retry } = useBikeAvailability(selectedSlot);
  const isLoadingBikes = status === 'loading';
  const bikesError = status === 'error';
  const selectedBike = selection?.slotKey === slotKey && !takenBikes.includes(selection.bike)
    ? selection.bike : null;
  const canCheckout = status === 'ready' && selectedBike !== null && !BIKE_CONFIG.maintenance.includes(selectedBike);
  const totalBikes = BIKE_CONFIG.total;
  const checkoutBarRef = useRef<HTMLDivElement>(null);

  // Compact dialogs keep the footer visible, so selecting a bike must not move the map.
  useEffect(() => {
    if (compact || selectedBike === null || window.innerWidth > 768) return;
    const timer = setTimeout(() => {
      const bar = checkoutBarRef.current;
      if (!bar) return;
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
      bar.scrollIntoView({ behavior, block: 'nearest' });
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedBike, compact]);

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
    if (status !== 'ready' || takenBikes.includes(num) || BIKE_CONFIG.maintenance.includes(num)) return;
    setSelection({ slotKey, bike: num });
  };

  const handleCheckout = () => {
    if (canCheckout && selectedBike !== null) {
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
      ? 'Fila 1 · Frente al instructor · Favorita'
      : 'Fila 1 · Frente al instructor';
    if (row === 2) return isPopular
      ? 'Fila 2 · Fondo del salón · Favorita'
      : 'Fila 2 · Fondo del salón';
    return null;
  };

  // Estado del step indicator
  const stepClass = selectedSlot ? 'completed' : 'active';
  const stepBike = selectedSlot ? (selectedBike ? 'completed' : 'active') : (selectedBike ? 'active' : 'pending');
  const stepPay = selectedSlot && selectedBike ? 'active' : 'pending';

  return (
    <section className={`bike-selector${compact ? ' bike-selector--compact' : ''}`} id={compact ? undefined : "reservar"}>
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
                {availableCount === null ? (
                  <span className="stock-badge">{bikesError ? 'Sin verificar' : 'Consultando…'}</span>
                ) : availableCount > 0 ? (
                  <span className="stock-badge available">🟢 {availableCount} disponibles</span>
                ) : (
                  <span className="stock-badge sold-out">⚠️ Sin disponibilidad</span>
                )}
              </div>
            )}
          </div>
          <p>Elige tu lugar en el salón. Consulta las filas, identifica al instructor y selecciona una bicicleta disponible.</p>

          <div className="bike-summary">
            {!selectedSlot ? (
              <p className="summary-empty summary-empty-noclass">
                Elige tu clase primero
              </p>
            ) : isLoadingBikes ? (
              <p className="summary-empty">Consultando disponibilidad…</p>
            ) : bikesError ? (
              <p className="summary-empty">Reintenta la consulta para elegir tu bici.</p>
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
                    onClick={() => setSelection(null)}
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
                    disabled={!canCheckout}
                    onClick={handleCheckout}
                  >
                    {selectedSlot.isFree ? 'Reservar gratis' : 'Confirmar reserva'}
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
                  <span className="class-info-label">{compact ? 'Tu acceso' : 'Precio'}</span>
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
            <li><span className="dot dot-popular"></span> Favorita</li>
            <li><span className="dot dot-maintenance"></span> Mantenimiento</li>
          </ul>

          {/* Counter de disponibilidad */}
          {selectedSlot && bikesError ? (
            <div className="availability-counter critical" role="alert">
              <span className="availability-dot" aria-hidden="true"></span>
              No se pudo verificar disponibilidad.
              <button type="button" className="bike-retry" onClick={retry}>Reintentar</button>
            </div>
          ) : selectedSlot && isLoadingBikes ? (
            <div className="availability-counter" role="status">Consultando disponibilidad…</div>
          ) : selectedSlot && availableCount !== null && (
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

          <BikeRoom
            selectedBike={selectedBike}
            takenBikes={takenBikes}
            locked={!selectedSlot}
            pending={status !== 'ready'}
            compact={compact}
            onSelect={handleBikeClick}
          />
        </div>
      </div>

      {/* Compact footer reserves its space before selection and never covers the map. */}
      {selectedSlot && (compact || canCheckout) && (
        <div ref={checkoutBarRef} className="sticky-checkout-bar" role="region" aria-label="Tu reserva">
          <div className="sticky-checkout-info">
            {!compact && <span className="sticky-bike">#{String(selectedBike).padStart(2, '0')}</span>}
            <div className="sticky-text" aria-live={compact ? 'polite' : undefined}>
              <span className="sticky-class">{compact
                ? selectedBike !== null ? `Bici ${String(selectedBike).padStart(2, '0')} · Fila ${getBikePosition(selectedBike).row}` : 'Elige tu bici'
                : selectedSlot.className}</span>
              <span className="sticky-position">{compact ? selectedSlot.price : selectedBike !== null && getBikeTooltip(selectedBike)}</span>
              {!compact && <span className="sticky-meta">{selectedSlot.hour} {selectedSlot.period} · {selectedSlot.price}</span>}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary sticky-checkout-cta"
            onClick={handleCheckout}
            disabled={!canCheckout}
          >
            {compact ? 'Continuar →' : 'Continuar reserva →'}
          </button>
        </div>
      )}
    </section>
  );
}
