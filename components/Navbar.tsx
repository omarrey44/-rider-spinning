import { useState, useEffect, useRef } from 'react';
import { useScrolled } from '@/hooks/useScrolled';

const SECTIONS = [
  { id: '#clases', label: 'Clases' },
  { id: '#horarios', label: 'Horarios' },
  { id: '#instructores', label: 'Instructores' },
  { id: '#precios', label: 'Precios' },
  { id: '#contacto', label: 'Contacto' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navbarScrolled = useScrolled(30);
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.querySelector(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const navLinks = SECTIONS.map(({ id, label }) => ({
    href: id,
    label,
    active: activeHash === id,
  }));

  return (
    <>
      <nav className={`navbar ${navbarScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Navegación principal">
        <div className="container nav-inner">
          <a href="#" className="logo" onClick={() => setMobileOpen(false)}>
            <img src="/logo2.webp" alt="Rideon Spinning Studio" className="logo-img" />
          </a>

          <ul className="nav-links">
            {navLinks.map(({ href, label, active }) => (
              <li key={href}>
                <a href={href} className={active ? 'active' : ''}>
                  {label}
                </a>
              </li>
            ))}
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
          {navLinks.map(({ href, label, active }) => (
            <a key={href} href={href} className={active ? 'active' : ''} onClick={() => setMobileOpen(false)}>
              {label}
            </a>
          ))}
          <a href="#reservar" className="btn btn-primary mobile-reserve-btn" onClick={() => setMobileOpen(false)}>Reservar ahora</a>
        </div>
      </nav>
    </>
  );
}
