-- ============================================================
-- RIDEON SPINNING — Update capacity 24 → 12
-- El estudio arranca con 12 bicis en lugar de 24.
-- ============================================================

-- 1. Cambia default de la columna (futuros inserts usarán 12)
alter table schedule_slots
  alter column capacity set default 12;

-- 2. Actualiza filas existentes (los seeds creados con default=24)
update schedule_slots
  set capacity = 12
  where capacity = 24;

-- 3. Verificación (opcional, comentar después de correr)
-- select count(*), capacity from schedule_slots group by capacity;
