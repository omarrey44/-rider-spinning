export default function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="#" className="logo logo-light">
            <img src="/logo.jpg" alt="Rideon Spinning Studio" className="logo-img" />
          </a>
          <p>Spinning Studio · Chihuahua</p>
          <p className="muted">Av. Ejemplo 123, Col. Centro<br />Lun–Sáb · 06:00 – 21:00</p>
        </div>

        <div className="footer-col">
          <h4>Estudio</h4>
          <a href="#clases">Clases</a>
          <a href="#instructores">Instructores</a>
          <a href="#precios">Precios</a>
        </div>

        <div className="footer-col">
          <h4>Soporte</h4>
          <a href="#">Política de cancelación</a>
          <a href="#">Preguntas frecuentes</a>
          <a href="#">Contacto</a>
        </div>

        <div className="footer-col">
          <h4>Síguenos</h4>
          <div className="socials">
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="TikTok">TT</a>
            <a href="#" aria-label="WhatsApp">WA</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Rideon Spinning Studio. Todos los derechos reservados.</span>
        <span>Hecho con sudor y rojo.</span>
      </div>
    </footer>
  );
}
