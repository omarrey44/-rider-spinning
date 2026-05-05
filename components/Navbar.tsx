import { useState } from 'react';
import { useScrolled } from '@/hooks/useScrolled';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navbarScrolled = useScrolled(30);

  return (
    <>
      <nav className={`navbar ${navbarScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Navegación principal">
        <div className="container nav-inner">
          <a href="#" className="logo">
            <img src="/logo.jpg" alt="Rideon Spinning Studio" className="logo-img" />
          </a>

          <ul className="nav-links">
            <li><a href="#clases">Clases</a></li>
            <li><a href="#horarios">Horarios</a></li>
            <li><a href="#instructores">Instructores</a></li>
            <li><a href="#precios">Precios</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>

          <a href="#reservar" className="btn btn-primary">Reservar ahora</a>

          <button
            className={`nav-toggle ${mobileOpen ? 'open' : ''}`}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Menú'}
            aria-expanded={mobileOpen}
            aria-controls="mobileMenu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>

        <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`} id="mobileMenu">
          <a href="#clases">Clases</a>
          <a href="#horarios">Horarios</a>
          <a href="#instructores">Instructores</a>
          <a href="#precios">Precios</a>
          <a href="#contacto">Contacto</a>
          <a href="#reservar" className="btn btn-primary mobile-reserve-btn">Reservar ahora</a>
        </div>
      </nav>
    </>
  );
}
