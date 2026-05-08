'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Launch from '@/components/Launch';
import HowItWorks from '@/components/HowItWorks';
import Schedule from '@/components/Schedule';
import BikeSelector from '@/components/BikeSelector';
import Instructors from '@/components/Instructors';
import Pricing from '@/components/Pricing';
import FindBooking from '@/components/FindBooking';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';
import CheckoutModal from '@/components/CheckoutModal';
import BackToTop from '@/components/BackToTop';
import { DayKey, ScheduleSlot } from '@/data/schedule';

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${revealed ? 'revealed' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [selectedSlot, setSelectedSlot] = useState<{
    slot: ScheduleSlot;
    day: DayKey;
  } | null>(null);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutBike, setCheckoutBike] = useState<{ number: number; row: number } | null>(null);

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

  const priceStr = selectedSlot?.slot.price.replace('$', '') ?? '220';
  const priceCents = parseInt(priceStr, 10) * 100;

  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <SmoothScroll />
      <Navbar />
      <Hero />

        <main id="main">
        <RevealSection><Launch /></RevealSection>
        <RevealSection delay={100}><HowItWorks /></RevealSection>
        <RevealSection delay={150}><Schedule onSelectSlot={handleSelectSlot} /></RevealSection>
        <RevealSection delay={100}><BikeSelector
          selectedSlot={selectedSlot?.slot ? {
            className: selectedSlot.slot.className,
            instructorName: selectedSlot.slot.instructorName,
            hour: selectedSlot.slot.hour,
            period: selectedSlot.slot.period,
            price: selectedSlot.slot.price,
            duration: selectedSlot.slot.duration,
            instructorClass: selectedSlot.slot.instructorClass,
            dayName: dayLabel,
            date: getDateForDay(selectedSlot.day),
            fullDateTime: getFullDateTime(selectedSlot.day),
          } : null}
          onCheckout={handleCheckout}
        /></RevealSection>
        <RevealSection delay={100}><Instructors /></RevealSection>
        <RevealSection delay={150}><Pricing /></RevealSection>
        <RevealSection delay={100}><FindBooking /></RevealSection>

        <RevealSection delay={100}>
        <section className="cta-final">
          <div className="container cta-inner">
            <h2>¿Listo para tu primer ride?</h2>
            <p>
              Tu primera clase tiene{' '}
              <span className="text-red">50% de descuento</span>. Solo para
              nuevos riders.
            </p>
            <a href="#horarios" className="btn btn-primary btn-lg">
              Empezar ahora
            </a>
          </div>
        </section>
        </RevealSection>
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
          dateTime={getFullDateTime(selectedSlot.day)}
          day={dayLabel}
          hour={`${selectedSlot.slot.hour} ${selectedSlot.slot.period}`}
          duration={selectedSlot.slot.duration}
          priceCents={priceCents}
          currency="MXN"
        />
      )}
    </>
  );
}
