-- ============================================================
-- 016 — Anti doble-reserva por FECHA (no por día de la semana)
-- ============================================================
-- El índice original usaba `day` (nombre del día), así que la misma bici de un
-- jueves bloqueaba otro jueves distinto. Se re-crea sobre `class_date` para que
-- la unicidad sea por la fecha real de la clase.

drop index if exists uniq_bike_slot_active;

create unique index if not exists uniq_bike_slot_active
  on bookings (bike_number, class_title, class_date, hour)
  where status in ('pending', 'confirmed');
