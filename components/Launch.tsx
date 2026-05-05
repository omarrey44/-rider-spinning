export default function Launch() {
  return (
    <section className="launch">
      <div className="container launch-inner">
        <span className="launch-pin">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          Llega a Chihuahua
        </span>

        <h2 className="launch-pre">Una nueva forma<br />de entrenar</h2>

        <h3 className="launch-brand">
          <span className="brand-line">Rideon</span>
          <span className="brand-sub">Spinning Studio</span>
        </h3>

        <p className="launch-tag">
          Donde la <em>energía</em>, la <em>música</em> y el <em>rendimiento</em><br />
          se convierten en una experiencia.
        </p>

        <div className="launch-cta">
          <a href="#horarios" className="btn btn-primary btn-lg">Reservar mi primera clase</a>
        </div>
      </div>

      <div className="launch-marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span>Ride Fast</span><span className="dot-sep">●</span>
              <span>Ride Together</span><span className="dot-sep">●</span>
              <span>Rideon</span><span className="dot-sep">●</span>
              <span>Pedalea Rápido. Llega Lejos.</span><span className="dot-sep">●</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
