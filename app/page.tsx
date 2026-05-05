'use client';

import { useState, useCallback } from 'react';
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
import SectionDivider from '@/components/SectionDivider';
import { DayKey, ScheduleSlot } from '@/data/schedule';

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
        <Launch />
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <Schedule onSelectSlot={handleSelectSlot} />
        <SectionDivider />
        <BikeSelector
          selectedSlot={selectedSlot?.slot ? {
            className: selectedSlot.slot.className,
            instructorName: selectedSlot.slot.instructorName,
            hour: selectedSlot.slot.hour,
            period: selectedSlot.slot.period,
            price: selectedSlot.slot.price,
          } : null}
          onCheckout={handleCheckout}
        />
        <SectionDivider />
        <Instructors />
        <SectionDivider />
        <Pricing />
        <SectionDivider />
        <FindBooking />
        <SectionDivider />

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
      </main>

      <Footer />

      {checkoutOpen && checkoutBike && selectedSlot && (
        <CheckoutModal
          open={checkoutOpen}
          onClose={handleCloseModal}
          bikeNumber={checkoutBike.number}
          bikeRow={checkoutBike.row}
          className={selectedSlot.slot.className}
          instructorName={selectedSlot.slot.instructorName}
          day={dayLabel}
          hour={`${selectedSlot.slot.hour} ${selectedSlot.slot.period}`}
          priceCents={priceCents}
          currency="MXN"
        />
      )}
    </>
  );
}
