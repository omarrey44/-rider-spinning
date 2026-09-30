'use client';

import type { CSSProperties } from 'react';
import { ArrowDown, Check, Headphones, LockKeyhole, MoveHorizontal, Star, Wrench } from 'lucide-react';
import { BIKE_CONFIG } from '@/data/schedule';
import styles from './BikeRoom.module.css';

const rows = BIKE_CONFIG.rowConfig.map((count, index, counts) => ({
  number: index + 1,
  bikes: Array.from({ length: count }, (_, offset) =>
    counts.slice(0, index).reduce((sum, size) => sum + size, 0) + offset + 1),
}));

interface BikeRoomProps {
  selectedBike: number | null;
  takenBikes: number[];
  locked: boolean;
  pending: boolean;
  compact?: boolean;
  onSelect: (bike: number) => void;
}

export default function BikeRoom({ selectedBike, takenBikes, locked, pending, compact, onSelect }: BikeRoomProps) {
  const isFull = !pending && rows.every(({ bikes }) => bikes.every((bike) =>
    takenBikes.includes(bike) || BIKE_CONFIG.maintenance.includes(bike)));
  return (
    <div className={`${styles.room}${compact ? ` ${styles.compact}` : ''}${locked ? ` ${styles.locked}` : ''}`}>
      <div className={styles.scrollHint}><MoveHorizontal size={14} aria-hidden="true" /> Desliza para ver toda la fila</div>
      <div className={styles.viewport} role="group" aria-label="Mapa del salón. El instructor está al frente.">
        <div className={styles.scene}>
          <div className={styles.stage}>
            <span className={styles.stageLabel}><Headphones size={13} aria-hidden="true" /> INSTRUCTOR</span>
            <img src="/Instructor-Bike.png" width={739} height={336} alt="" draggable={false} className={styles.instructor} />
            <span className={styles.frontLabel}>FRENTE DEL SALÓN</span>
          </div>

          {rows.map(({ number, bikes }) => (
            <div key={number} className={styles.rowGroup}>
              <div className={styles.rowHeading}>
                <span>FILA {number.toString().padStart(2, '0')}</span>
                <span>{number === 1 ? 'Frente al instructor' : 'Fondo del salón'}</span>
              </div>
              <div className={styles.row} style={{ '--bikes': bikes.length } as CSSProperties}>
                {bikes.map((num, index) => {
                  const maintenance = BIKE_CONFIG.maintenance.includes(num);
                  const taken = takenBikes.includes(num);
                  const disabled = locked || pending || maintenance || taken;
                  const selected = selectedBike === num && !disabled;
                  const popular = BIKE_CONFIG.popular.includes(num);
                  const state = maintenance ? 'maintenance' : locked || pending ? 'pending' : taken ? 'taken' : selected ? 'selected' : 'available';
                  const label = maintenance ? 'En mantenimiento' : locked ? 'Elige una clase' : pending ? 'Disponibilidad sin confirmar' : taken ? 'Ocupada' : selected ? 'Tu selección' : 'Disponible';
                  const StatusIcon = maintenance ? Wrench : taken && !pending ? LockKeyhole : selected ? Check : popular && !pending && !locked ? Star : null;

                  return (
                    <button
                      key={num}
                      type="button"
                      className={styles.bike}
                      data-state={state}
                      disabled={disabled}
                      aria-pressed={selected}
                      aria-label={`Bicicleta ${num}, fila ${number}, ${label.toLowerCase()}${popular && !disabled ? ', favorita' : ''}`}
                      title={`Bici ${String(num).padStart(2, '0')} · ${label}${popular && !disabled ? ' · Favorita' : ''}`}
                      onClick={() => onSelect(num)}
                    >
                      <span className={styles.model}>
                        <img
                          src="/bike-studio-v2.webp"
                          width={320}
                          height={397}
                          alt=""
                          draggable={false}
                          decoding="async"
                          className={index >= Math.ceil(bikes.length / 2) ? styles.flipped : undefined}
                        />
                      </span>
                      <span className={styles.pedestal} aria-hidden="true" />
                      <span className={styles.number}>{String(num).padStart(2, '0')}</span>
                      {StatusIcon && <span className={styles.badge} aria-hidden="true"><StatusIcon size={12} strokeWidth={2.5} /></span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className={styles.exit}><ArrowDown size={12} aria-hidden="true" /> FONDO · SALIDA</div>
        </div>
      </div>
      <p className={styles.selection} role="status" aria-live="polite">
        {locked ? 'Elige tu clase para consultar los lugares.' : pending ? 'Esperando disponibilidad del salón…' : selectedBike !== null
          ? <><Check size={15} aria-hidden="true" /> Bici {String(selectedBike).padStart(2, '0')} seleccionada{!compact && ' · Puedes cambiarla antes de continuar.'}</>
          : isFull ? 'Clase llena. Elige otro día u horario.' : 'Toca una bici disponible para elegir tu lugar.'}
      </p>
    </div>
  );
}
