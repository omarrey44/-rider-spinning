-- ============================================================
-- 017 — Vincular reservas con la membresía usada
-- ============================================================
-- Permite saber con qué membresía se reservó una clase (pack o mensualidad),
-- para restituir el crédito al pack correcto al cancelar y NO regalar créditos
-- cuando la reserva fue de mensualidad (ambas usan amount_paid = 0).

alter table bookings add column if not exists membership_id uuid;
