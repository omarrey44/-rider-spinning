-- ============================================================
-- 015 — Exención de la cuota de mantenimiento (pago en efectivo)
-- ============================================================
-- Marca una suscripción como exenta del cobro/​bloqueo de la cuota de
-- mantenimiento (p. ej. clientes que la pagan en efectivo en el estudio).
-- Cuando es true: no se cobra online, no se bloquean reservas y no se envían
-- recordatorios de cuota para esa membresía.

alter table memberships add column if not exists maintenance_exempt boolean not null default false;
