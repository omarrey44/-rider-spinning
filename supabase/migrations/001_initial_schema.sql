-- ============================================================
-- RIDEON SPINNING STUDIO — Schema inicial
-- Ejecuta esto en Supabase: SQL Editor → New Query → Pega → Run
-- ============================================================
-- Modelo denormalizado a propósito: en MVP guardamos los datos
-- de la clase como strings inline (class_title, instructor_name,
-- day, hour) para no atarnos a tablas de catálogo todavía.
-- Si después quieres normalizar (FK a classes/instructors), se
-- puede migrar sin romper el código.
-- ============================================================

create extension if not exists "pgcrypto";

-- ====== BOOKINGS ======
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),

  -- Datos del cliente (guest checkout, sin tabla profiles)
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,

  -- Detalle de la bici reservada
  bike_number int not null check (bike_number > 0),
  bike_row    int not null check (bike_row > 0),

  -- Detalle de la clase (denormalizado)
  class_title     text not null,        -- "Sunrise Ride"
  instructor_name text not null,        -- "Rosario González Muñoz"
  day  text not null,                   -- "Lunes", "Martes", ... "Sábado"
  hour text not null,                   -- "06:00 AM", "06:00 PM"

  -- Stripe tracking
  stripe_session_id        text unique,                 -- previene duplicados si Stripe reintenta el webhook
  stripe_payment_intent_id text,
  amount_paid int,                                       -- en centavos (22000 = $220.00 MXN)

  -- Estado
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'refunded')),
  cancelled_at timestamptz,

  created_at timestamptz default now()
);

-- ====== INDICES ======
-- Lookup de reservas por email (FindBooking)
create index if not exists idx_bookings_email
  on bookings (lower(customer_email));

-- Búsqueda por slot (futuro: BikeSelector consulta disponibilidad)
create index if not exists idx_bookings_slot
  on bookings (class_title, day, hour)
  where status in ('pending', 'confirmed');

-- ====== ANTI DOUBLE-BOOKING ======
-- Una bici no puede estar reservada 2 veces en el mismo (clase, día, hora)
-- Permite re-bookear la misma bici si la reserva previa fue cancelada
create unique index if not exists uniq_bike_slot_active
  on bookings (bike_number, class_title, day, hour)
  where status in ('pending', 'confirmed');

-- ====== ROW LEVEL SECURITY ======
-- Filosofía: el browser NUNCA escribe directo. Todas las inserciones/lecturas
-- pasan por API routes que usan SUPABASE_SERVICE_ROLE_KEY (bypassa RLS).
-- Por defecto sin policies = nada accesible al cliente anon.
alter table bookings enable row level security;

-- ============================================================
-- DONE. Total: 1 tabla (bookings), 3 índices, RLS activado.
-- ============================================================
