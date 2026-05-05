import { useCounterOnView } from '@/hooks/useCounterOnView';
import { ArrowRight, PlayIcon } from './Icons';

export default function Hero() {
  const kmCounter = useCounterOnView(12450);

  return (
    <header className="hero">
      <div className="hero-bg">
        <div className="hero-overlay"></div>
        <svg className="rabbit-trail" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-50 150 Q 300 80 600 130 T 1500 60" stroke="var(--teal-primary)" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="8 12" />
        </svg>
      </div>

      <div className="container hero-content">
        <div className="hero-text">
          <span className="hero-eyebrow">// SPINNING STUDIO · CHIHUAHUA</span>
          <h1 className="hero-title">
            <span className="title-line">Pedalea <span className="text-red"> <br />Rápido</span></span>
            <span className="title-line">Llega <span className="text-red">Lejos</span></span>
          </h1>
          <p className="hero-sub">
            Clases de spinning de alta intensidad en una sala diseñada para empujarte al siguiente nivel. Reserva tu bici, elige tu lugar y prepárate para sudar.
          </p>

          <div className="hero-ctas">
            <a href="#horarios" className="btn btn-primary btn-lg">Reservar Clase <ArrowRight /></a>
            <button className="btn btn-ghost btn-lg" type="button">
              <span className="play-icon"><PlayIcon /></span>Ver Video
            </button>
          </div>

          <div className="hero-proof">
            <div className="avatars">
              <span className="avatar" style={{ background: 'linear-gradient(135deg,#FF6B6B,#E10600)' }}></span>
              <span className="avatar" style={{ background: 'linear-gradient(135deg,#4ECDC4,#1A535C)' }}></span>
              <span className="avatar" style={{ background: 'linear-gradient(135deg,#FFE66D,#FF6B00)' }}></span>
            </div>
            <div className="proof-text">
              <strong ref={kmCounter.ref as React.RefObject<HTMLElement>}>{kmCounter.value}</strong> km pedaleados
              <span>esta semana por nuestra comunidad</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-bg"></div>
            <div className="hero-card-content">
              <span className="badge badge-live">● PRÓXIMA CLASE</span>
              <h3>Sunset Sprint</h3>
              <p>Con Lucia Frescas · 60 min · 18:00</p>
              <div className="bike-preview">
                <div className="bike-row">
                  <span className="bike taken"></span><span className="bike taken"></span>
                  <span className="bike free"></span><span className="bike free"></span><span className="bike taken"></span>
                </div>
                <div className="bike-row">
                  <span className="bike taken"></span><span className="bike selected"></span>
                  <span className="bike free"></span><span className="bike taken"></span><span className="bike free"></span>
                </div>
                <div className="bike-row">
                  <span className="bike free"></span><span className="bike taken"></span>
                  <span className="bike taken"></span><span className="bike free"></span><span className="bike free"></span>
                </div>
              </div>
              <div className="hero-card-footer">
                <span>Bike #07 · Fila 2</span>
                <strong>$220 MXN</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-slash" aria-hidden="true">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <polygon points="0,100 1440,0 1440,100" fill="#FFFFFF" />
          <polygon points="0,100 1440,30 1440,40 0,100" fill="var(--teal-primary)" opacity="0.9" />
        </svg>
      </div>
    </header>
  );
}
