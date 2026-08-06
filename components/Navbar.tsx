import { useState, useEffect, useRef } from 'react';
import { useScrolled } from '@/hooks/useScrolled';

const CONTACT_WHATSAPP = 'https://wa.me/5216145951782';

type NavSection = { id: string; label: string; external?: string };

const SECTIONS: NavSection[] = [
  { id: '#horarios', label: 'Horarios' },
  { id: '#mis-reservas', label: 'Mis reservas' },
  { id: '#instructores', label: 'Instructores' },
  { id: '#precios', label: 'Precios' },
  { id: '#colaboradores', label: 'Colaboradores' },
  { id: '#feedback', label: 'Sugerencias' },
  { id: '#contacto', label: 'Contacto', external: CONTACT_WHATSAPP },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navbarScrolled = useScrolled(30);
  const [activeHash, setActiveHash] = useState('');
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (mobileOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const y = scrollYRef.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (y) window.scrollTo(0, y);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
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

    SECTIONS.forEach(({ id, external }) => {
      if (external) return;
      const el = document.querySelector(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const navLinks = SECTIONS.map((s) => ({
    href: s.external ?? s.id,
    label: s.label,
    active: !s.external && activeHash === s.id,
    external: !!s.external,
  }));

  return (
    <>
      <nav className={`navbar ${navbarScrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Navegación principal">
        <div className="container nav-inner">
          <a href="#" className="logo" onClick={() => setMobileOpen(false)}>
            <img src="/logo2.webp" alt="Rideon Spinning Studio" className="logo-img" />
          </a>

          <ul className="nav-links">
            {navLinks.map(({ href, label, active, external }) => (
              <li key={href}>
                <a
                  href={href}
                  className={active ? 'active' : ''}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
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
          {navLinks.map(({ href, label, active, external }) => (
            <a
              key={href}
              href={href}
              className={active ? 'active' : ''}
              onClick={() => setMobileOpen(false)}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {label}
            </a>
          ))}
          <a href="#reservar" className="btn btn-primary mobile-reserve-btn" onClick={() => setMobileOpen(false)}>Reservar ahora</a>
        </div>
      </nav>
    </>
  );
}
