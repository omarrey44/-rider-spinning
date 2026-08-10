-- ============================================================
-- 014 — Columnas para la cuota de mantenimiento semanal (suscripciones)
-- ============================================================
-- Ver lib/maintenance.ts. La cuota de $250 se cobra en 4 semanas el primer mes
-- de cada semestre. Guardamos cuánto se ha pagado este semestre y a qué
-- semestre corresponde (para resetear en el nuevo ciclo), más la última semana
-- notificada por correo (para no spamear).

alter table memberships add column if not exists maintenance_semester_start timestamptz;
alter table memberships add column if not exists maintenance_paid_cents int not null default 0;
alter table memberships add column if not exists maintenance_last_reminder_week int not null default 0;
-- Guarda el último checkout de mantenimiento aplicado (idempotencia del webhook).
alter table memberships add column if not exists maintenance_last_session_id text;
