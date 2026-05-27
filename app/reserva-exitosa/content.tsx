'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReservaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const customerName = searchParams.get('customer_name') || 'Ciclista';
  const classTitle = searchParams.get('class_title') || '';
  const instructorName = searchParams.get('instructor_name') || '';
  const day = searchParams.get('day') || '';
  const hour = searchParams.get('hour') || '';
  const amount = searchParams.get('amount') || '';
  const bikeNumber = searchParams.get('bike_number') || '';
  const bikeRow = searchParams.get('bike_row') || '';
  const testMode = searchParams.get('test') === 'true';

  if (!isClient) return null;

  const hasClassDetails = classTitle && day && hour;
  const displayAmount = amount ? `$${parseFloat(amount).toLocaleString('es-MX')} MXN` : '';

  return (
    <main className="success-page">
      <div className="success-container">
        {/* Header visual con animación */}
        <div className="success-header">
          <div className="success-icon">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="checkmark-icon"
            >
              <path d="M20 60L40 75L75 25" />
            </svg>
          </div>
          <h1>¡Tu reserva está confirmada!</h1>
          <p className="success-subtitle">
            Revisa tu correo para los detalles de tu {hasClassDetails ? 'clase' : 'compra'}
          </p>
        </div>

        {/* Email visual confirmation */}
        <div className="email-visual">
          <div className="email-header">
            <div className="email-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </div>
            <div>
              <p className="email-label">Confirmación enviada a tu correo</p>
            </div>
          </div>

          {/* Booking details card */}
          <div className="booking-details">
            <div className="detail-row">
              <span className="detail-label">Nombre</span>
              <span className="detail-value">{customerName}</span>
            </div>

            {hasClassDetails && (
              <>
                <div className="detail-row">
                  <span className="detail-label">Clase</span>
                  <span className="detail-value">{classTitle}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Instructor</span>
                  <span className="detail-value">{instructorName || 'Por definir'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Fecha y hora</span>
                  <span className="detail-value">{day} · {hour}</span>
                </div>
                {bikeNumber && bikeRow && (
                  <div className="detail-row">
                    <span className="detail-label">Tu bici</span>
                    <span className="detail-value">#{String(bikeNumber).padStart(2, '0')} · Fila {bikeRow}</span>
                  </div>
                )}
              </>
            )}

            {displayAmount && (
              <div className="detail-row amount">
                <span className="detail-label">Monto</span>
                <span className="detail-value">{displayAmount}</span>
              </div>
            )}
          </div>

          {/* Test mode indicator */}
          {testMode && (
            <div className="test-mode-banner">
              <p>Modo prueba — Este es un pago de prueba</p>
            </div>
          )}
        </div>

        {/* Next steps */}
        <div className="success-next-steps">
          <h2>¿Qué sigue?</h2>
          <ul className="steps-list">
            <li>
              <span className="step-icon">1</span>
              <div>
                <p className="step-title">Revisa tu correo</p>
                <p className="step-desc">Recibirás la confirmación con los detalles en los próximos minutos</p>
              </div>
            </li>
            {hasClassDetails && (
              <li>
                <span className="step-icon">2</span>
                <div>
                  <p className="step-title">Llega 15 minutos antes</p>
                  <p className="step-desc">Estacionamiento disponible · Vestiarios con duchas · Casilleros</p>
                </div>
              </li>
            )}
            <li>
              <span className="step-icon">{hasClassDetails ? 3 : 2}</span>
              <div>
                <p className="step-title">¡Prepárate a pedalear!</p>
                <p className="step-desc">Trae tu botella de agua y prepárate para una clase épica</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="success-actions">
          {hasClassDetails && (
            <button
              onClick={() => router.push('/#horarios')}
              className="btn btn-primary"
            >
              Ver más clases
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="btn btn-outline"
          >
            Volver al inicio
          </button>
        </div>

        {/* FAQ callout */}
        <div className="success-faq">
          <p className="faq-title">¿Preguntas frecuentes?</p>
          <div className="faq-items">
            <details>
              <summary>¿Cómo cancelo mi {hasClassDetails ? 'reserva' : 'compra'}?</summary>
              <p>Puedes cancelar directamente desde tu email o contactando a nuestro equipo con 2 horas de anticipación mínimo.</p>
            </details>
            <details>
              <summary>¿Puedo modificar mi {hasClassDetails ? 'reserva' : 'compra'}?</summary>
              <p>Sí, contáctanos en administracion@rideonspinningstudio.com y haremos el cambio por ti.</p>
            </details>
            <details>
              <summary>¿Dónde está el estudio?</summary>
              <p>Estamos ubicados en Plaza San Agustín local 23, Chihuahua, México. Los detalles completos van en tu email de confirmación.</p>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
