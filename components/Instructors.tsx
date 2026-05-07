export default function Instructors() {
  return (
    <section className="instructors" id="instructores">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Quién te empuja</span>
          <h2>Instructores que <span className="text-red">cambian tu día</span></h2>
        </div>

        <div className="instructor-grid instructor-grid-3">
          <article className="instructor-card">
            <div className="instructor-photo" style={{ background: 'linear-gradient(135deg,#1A1A1A,#E10600)' }}></div>
            <h3>Rosario Muñoz González</h3>
            <span>Turno mañana · Lunes a Viernes</span>
            <p>"El mejor regalo que te puedes dar es empezar el día moviéndote."</p>
          </article>
          <article className="instructor-card">
            <div className="instructor-photo" style={{ background: 'linear-gradient(135deg,#E10600,#FFB800)' }}></div>
            <h3>Lucia Isamar Frescas González</h3>
            <span>Turno tarde · Lunes a Viernes</span>
            <p>"Después del trabajo, tu cuerpo merece soltar el día."</p>
          </article>
          <article className="instructor-card">
            <div className="instructor-photo" style={{ background: 'linear-gradient(135deg,#0A0A0A,#4ECDC4)' }}></div>
            <h3>Elmer Alsides</h3>
            <span>Sábados · Sesiones especiales</span>
            <p>"El fin de semana es para ti. Sube a la bici y disfruta."</p>
          </article>
        </div>
      </div>
    </section>
  );
}
