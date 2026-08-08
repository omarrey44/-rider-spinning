'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TestModeDetector from '@/components/TestModeDetector';
import GrandOpening from '@/components/GrandOpening';
import HowItWorks from '@/components/HowItWorks';
import Schedule from '@/components/Schedule';
import BikeSelector from '@/components/BikeSelector';
import Instructors from '@/components/Instructors';
import Pricing from '@/components/Pricing';
import Colaboradores from '@/components/Colaboradores';
import FAQ from '@/components/FAQ';
import Feedback from '@/components/Feedback';
import FindBooking from '@/components/FindBooking';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import CheckoutModal from '@/components/CheckoutModal';
import PackCheckoutModal from '@/components/PackCheckoutModal';
import SubscriptionCheckoutModal from '@/components/SubscriptionCheckoutModal';
import BackToTop from '@/components/BackToTop';
import { DayKey, ScheduleSlot, EVENT_DAY_LABEL } from '@/data/schedule';

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealState, setRevealState] = useState<'idle' | 'pending' | 'revealed'>('idle');

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isNearViewport = element.getBoundingClientRect().top <= window.innerHeight * 1.1;

    if (reducedMotion || isNearViewport) {
      setRevealState('revealed');
      return;
    }

    setRevealState('pending');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealState('revealed');
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal reveal--${revealState}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}


export default function Home() {
  const [showCancelBanner, setShowCancelBanner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'cancelled') {
      setShowCancelBanner(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const [selectedSlot, setSelectedSlot] = useState<{
    slot: ScheduleSlot;
    day: DayKey;
  } | null>(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutBike, setCheckoutBike] = useState<{ number: number; row: number } | null>(null);
  const [packCheckoutOpen, setPackCheckoutOpen] = useState(false);
  const [subscriptionCheckoutOpen, setSubscriptionCheckoutOpen] = useState(false);

  const handleSelectSlot = useCallback((slot: ScheduleSlot, day: DayKey) => {
    setSelectedSlot({ slot, day });
  }, []);

  const handleCheckout = useCallback((bikeNumber: number, bikeRow: number) => {
    setCheckoutBike({ number: bikeNumber, row: bikeRow });
    setCheckoutOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setCheckoutOpen(false);
  }, []);

  const dayLabel = selectedSlot
    ? { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado' }[selectedSlot.day]
    : '';

  const getDateForDay = (dayKey: DayKey): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const offsets: Record<DayKey, number> = { lun: 0, mar: 1, mie: 2, jue: 3, vie: 4, sab: 5 };
    const target = new Date(today);
    target.setDate(today.getDate() + mondayOffset + (offsets[dayKey] ?? 0));
    if (target < today) target.setDate(target.getDate() + 7);
    return target.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  };

  const getFullDateTime = (dayKey: DayKey): string => {
    const dayNames: Record<DayKey, string> = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado' };
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const offsets: Record<DayKey, number> = { lun: 0, mar: 1, mie: 2, jue: 3, vie: 4, sab: 5 };
    const target = new Date(today);
    target.setDate(today.getDate() + mondayOffset + (offsets[dayKey] ?? 0));
    if (target < today) target.setDate(target.getDate() + 7);
    const dateStr = target.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
    const hourStr = selectedSlot?.slot.hour ?? '';
    const periodStr = selectedSlot?.slot.period ?? '';
    return `${dayNames[dayKey]} ${dateStr} ${hourStr} ${periodStr}`;
  };

  const getClassDateISO = (dayKey: DayKey): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const offsets: Record<DayKey, number> = { lun: 0, mar: 1, mie: 2, jue: 3, vie: 4, sab: 5 };
    const target = new Date(today);
    target.setDate(today.getDate() + mondayOffset + (offsets[dayKey] ?? 0));
    if (target < today) target.setDate(target.getDate() + 7);
    return target.toISOString().split('T')[0];
  };

  // Formatea una fecha de evento fija (ISO 'YYYY-MM-DD') a "8 de agosto".
  // Se ancla a mediodía para evitar corrimiento por zona horaria.
  const formatEventDate = (iso: string): string =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });

  const isFreeSlot = selectedSlot?.slot.isFree === true;
  const eventDate = selectedSlot?.slot.eventDate;

  // Día usado para reservar/consultar disponibilidad. Los slots de evento se
  // aíslan bajo EVENT_DAY_LABEL para no chocar con los sábados normales.
  const bookingDay = isFreeSlot ? EVENT_DAY_LABEL : dayLabel;

  // Fecha mostrada / ISO: para slots de evento usamos la fecha fija; si no, la recurrente.
  const displayDate = selectedSlot
    ? (eventDate ? formatEventDate(eventDate) : getDateForDay(selectedSlot.day))
    : '';
  const isoDate = selectedSlot
    ? (eventDate ? eventDate : getClassDateISO(selectedSlot.day))
    : '';
  const fullDateTime = selectedSlot
    ? (eventDate
        ? `${dayLabel} ${formatEventDate(eventDate)} ${selectedSlot.slot.hour} ${selectedSlot.slot.period}`
        : getFullDateTime(selectedSlot.day))
    : '';

  const priceStr = selectedSlot?.slot.price.replace(/[$,\s]/g, '') ?? '200';
  const priceCents = isFreeSlot ? 0 : Math.round(parseFloat(priceStr) * 100);

  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <TestModeDetector />
      <SmoothScroll />
      <Navbar />

      {showCancelBanner && (
        <div className="payment-cancel-banner" role="alert">
          <span className="cancel-banner-icon">⚠️</span>
          <span className="cancel-banner-text">El pago fue cancelado — tu bici sigue disponible.</span>
          <a href="#horarios" className="cancel-banner-cta" onClick={() => setShowCancelBanner(false)}>
            Intentar de nuevo →
          </a>
          <button className="cancel-banner-close" onClick={() => setShowCancelBanner(false)} aria-label="Cerrar">✕</button>
        </div>
      )}

      <Hero />

      <main id="main">
        <RevealSection><GrandOpening /></RevealSection>
        <RevealSection delay={100}><Schedule onSelectSlot={handleSelectSlot} /></RevealSection>
        <RevealSection delay={100}><BikeSelector
          selectedSlot={selectedSlot?.slot ? {
            className: selectedSlot.slot.className,
            instructorName: selectedSlot.slot.instructorName,
            hour: selectedSlot.slot.hour,
            period: selectedSlot.slot.period,
            price: selectedSlot.slot.price,
            duration: selectedSlot.slot.duration,
            instructorClass: selectedSlot.slot.instructorClass,
            dayName: bookingDay,
            date: displayDate,
            fullDateTime: fullDateTime,
            isFree: isFreeSlot,
          } : null}
          onCheckout={handleCheckout}
        /></RevealSection>
        <RevealSection delay={100}><HowItWorks /></RevealSection>
        <RevealSection delay={100}><Instructors /></RevealSection>
        <RevealSection delay={150}><Pricing onPackClick={() => setPackCheckoutOpen(true)} onSubscribeClick={() => setSubscriptionCheckoutOpen(true)} /></RevealSection>
        <RevealSection delay={100}><FAQ /></RevealSection>
        <RevealSection delay={100}><Colaboradores /></RevealSection>
        <RevealSection delay={100}><FindBooking /></RevealSection>
        <RevealSection delay={100}><Feedback /></RevealSection>
      </main>

      <Footer />
      <BackToTop />

      {checkoutOpen && checkoutBike && selectedSlot && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={handleCloseModal}
          bikeNumber={checkoutBike.number}
          bikeRow={checkoutBike.row}
          className={selectedSlot.slot.className}
          instructorName={selectedSlot.slot.instructorName}
          dateTime={fullDateTime}
          day={bookingDay}
          hour={`${selectedSlot.slot.hour} ${selectedSlot.slot.period}`}
          duration={selectedSlot.slot.duration}
          priceCents={priceCents}
          classDate={isoDate}
          currency="MXN"
          isFree={isFreeSlot}
        />
      )}

      <PackCheckoutModal
        open={packCheckoutOpen}
        onClose={() => setPackCheckoutOpen(false)}
      />

      <SubscriptionCheckoutModal
        open={subscriptionCheckoutOpen}
        onClose={() => setSubscriptionCheckoutOpen(false)}
      />
    </>
  );
}
