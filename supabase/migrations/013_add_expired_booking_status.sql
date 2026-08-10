-- ============================================================
-- 013 — Permitir status 'expired' en bookings
-- ============================================================
-- El auto-liberado de reservas pendientes abandonadas (>10 min) marca la
-- fila como 'expired' (ver app/api/bookings/available-bikes y slot-counts).
-- El CHECK original (001) solo permitía pending/confirmed/cancelled/refunded,
-- así que ese UPDATE fallaba en silencio (error 23514) y la bici nunca se
-- liberaba. Agregamos 'expired' al constraint.

alter table bookings drop constraint if exists bookings_status_check;

alter table bookings add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'cancelled', 'refunded', 'expired'));
