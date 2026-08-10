interface PricingProps {
  onPackClick?: () => void;
  onSubscribeClick?: () => void;
}

export default function Pricing({ onPackClick, onSubscribeClick }: PricingProps) {
  return (
    <section className="pricing" id="precios">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Membresías</span>
          <h2>Pedalea más, <span className="text-red">paga menos</span></h2>
        </div>

        <div className="pricing-grid">
          <article className="price-card">
            <div className="price-head">
              <div className="price-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
              <div>
                <h3>Clase suelta</h3>
                <p className="plan-desc">Para probar sin compromiso</p>
              </div>
            </div>
            <div className="price-row">
              <span className="currency">$</span>
              <span className="amount">200</span>
              <span className="period">MXN<br />/clase</span>
            </div>
            <ul className="price-features">
              <li>1 clase a tu ritmo</li>
              <li>Sin compromiso mensual</li>
              <li>Reserva con 1 día de anticipación</li>
              <li>Cancela hasta 4h antes</li>
            </ul>
            <a href="#horarios" className="btn btn-outline btn-block">Reservar</a>
          </article>

          <article className="price-card featured">
            <span className="featured-badge">★ Más popular</span>
            <div className="price-head">
              <div className="price-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" /></svg>
              </div>
              <div>
                <h3>Pack 3 clases</h3>
                <p className="plan-desc">El favorito de la comunidad</p>
              </div>
            </div>
            <div className="price-row">
              <span className="currency">$</span>
              <span className="amount">300</span>
              <span className="period">MXN<br />3 clases</span>
            </div>
            <span className="save-badge">↓ Ahorras $300 vs 3 clases sueltas</span>
            <ul className="price-features">
              <li>3 clases · vigencia 7 días</li>
              <li>Reserva con 7 días de anticipación</li>
              <li>Cancela hasta 2h antes</li>
              <li>Comparte con un amigo</li>
            </ul>
            <button onClick={onPackClick || (() => {})} className="btn btn-primary btn-block">Comprar pack</button>
          </article>

          <article className="price-card">
            <div className="price-head">
              <div className="price-icon">
                {/* Crown icon — denota plan premium / acceso ilimitado */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18l-1.5-9-4.5 4-3-6-3 6-4.5-4L3 18z"/><path d="M3 22h18"/></svg>
              </div>
              <div>
                <h3>Mensualidad</h3>
                <p className="plan-desc">Para los que viven en la bici</p>
              </div>
            </div>
            <div className="price-row">
              <span className="currency">$</span>
              <span className="amount">650</span>
              <span className="period">MXN<br />/mes</span>
            </div>
            <ul className="price-features">
              <li>Clases ilimitadas</li>
              <li>🔄 Se renueva cada mes · cancela cuando quieras</li>
              <li>Reserva con 14 días</li>
              <li>Botella + toalla cortesía</li>
              <li>Acceso a eventos exclusivos</li>
              <li className="price-promo">🎉 Sin inscripción este mes (desde septiembre $250)</li>
            </ul>
            <button onClick={onSubscribeClick || (() => {})} className="btn btn-outline btn-block">Suscribirme</button>
          </article>
        </div>
      </div>
    </section>
  );
}
