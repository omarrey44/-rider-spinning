-- ============================================================
-- RIDEON SPINNING STUDIO — Schema inicial
-- Ejecuta esto en Supabase: SQL Editor → New Query → Pega → Run
-- ============================================================

-- Necesario para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ====== INSTRUCTORES ======
create table if not exists instructors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  short_name text not null,           -- "Rosario M."
  bio text,
  avatar_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- ====== CLASES (templates de clase) ======
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,                  -- "Sunrise Ride"
  description text,
  level text check (level in ('Principiante', 'Intermedio', 'Avanzado', 'Todos los niveles')),
  duration_min int default 60,
  price_cents int not null,             -- centavos para evitar floats (220.00 → 22000)
  currency text default 'MXN',
  stripe_price_id text,                 -- llenar cuando se cree el price en Stripe
  active boolean default true,
  created_at timestamptz default now()
);

-- ====== HORARIOS DEL CALENDARIO ======
create table if not exists schedule_slots (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  instructor_id uuid references instructors(id) on delete set null,
  day_of_week int check (day_of_week between 0 and 6) not null,  -- 0=dom, 1=lun ... 6=sáb
  start_time time not null,
  capacity int default 24,
  active boolean default true,
  created_at timestamptz default now()
);

-- ====== BICICLETAS FÍSICAS DEL SALÓN ======
create table if not exists bikes (
  id uuid primary key default gen_random_uuid(),
  number int not null unique,
  bike_row int not null,
  bike_col int not null,
  is_popular boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

-- ====== PLANES (membresías) ======
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,                   -- 'Clase suelta', 'Pack 5', 'Mensualidad'
  slug text unique not null,            -- 'clase-suelta', 'pack-5', 'mensualidad'
  description text,
  price_cents int not null,
  currency text default 'MXN',
  classes_included int,                 -- 1, 5, null=ilimitado
  validity_days int,                    -- 30 para pack, 30 para mensual, null para clase suelta
  stripe_price_id text,
  recurring boolean default false,      -- true para mensualidad
  popular boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

-- ====== RESERVAS ======
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references schedule_slots(id) not null,
  bike_id uuid references bikes(id) not null,
  booking_date date not null,           -- fecha real de la clase
  -- Guest checkout: datos del cliente in-line (sin tabla profiles obligatoria)
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  -- Stripe tracking
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount_cents int not null,
  -- Estado del booking
  status text check (status in ('pending', 'confirmed', 'cancelled', 'refunded')) default 'pending',
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  -- Una bici no puede estar reservada 2 veces el mismo slot+fecha (constraint clave)
  unique(slot_id, bike_id, booking_date)
);

-- ====== INDICES ======
create index if not exists idx_bookings_slot_date_status
  on bookings(slot_id, booking_date)
  where status in ('pending', 'confirmed');

create index if not exists idx_bookings_email on bookings(customer_email);
create index if not exists idx_bookings_stripe on bookings(stripe_session_id);
create index if not exists idx_slots_dow on schedule_slots(day_of_week, active);

-- ====== ROW LEVEL SECURITY ======
alter table instructors enable row level security;
alter table classes enable row level security;
alter table schedule_slots enable row level security;
alter table bikes enable row level security;
alter table plans enable row level security;
alter table bookings enable row level security;

-- Lectura pública de catálogos
drop policy if exists "Public read instructors" on instructors;
create policy "Public read instructors" on instructors
  for select using (active = true);

drop policy if exists "Public read classes" on classes;
create policy "Public read classes" on classes
  for select using (active = true);

drop policy if exists "Public read slots" on schedule_slots;
create policy "Public read slots" on schedule_slots
  for select using (active = true);

drop policy if exists "Public read bikes" on bikes;
create policy "Public read bikes" on bikes
  for select using (active = true);

drop policy if exists "Public read plans" on plans;
create policy "Public read plans" on plans
  for select using (active = true);

-- Bookings: solo se expone slot_id+bike_id+booking_date+status para calcular disponibilidad
-- IMPORTANTE: NO expone customer_email/phone/name al public client.
-- Las inserts/updates ocurren via API server-side con service_role key.
drop policy if exists "Public read booking availability" on bookings;
create policy "Public read booking availability" on bookings
  for select using (status in ('pending', 'confirmed'));

-- ============================================================
-- SEEDS — datos iniciales
-- ============================================================

-- Instructores
insert into instructors (full_name, short_name, bio) values
  ('Rosario Muñoz González', 'Rosario M.', 'El mejor regalo que te puedes dar es empezar el día moviéndote.'),
  ('Lucia Isamar Frescas González', 'Lucia F.', 'Después del trabajo, tu cuerpo merece soltar el día.'),
  ('Elmer Alsides', 'Elmer A.', 'El fin de semana es para ti. Sube a la bici y disfruta.')
on conflict do nothing;

-- Clases (templates)
insert into classes (title, description, level, price_cents) values
  ('Sunrise Ride', 'Inicio del día', 'Principiante', 22000),
  ('Power Up', 'Energía pura', 'Intermedio', 22000),
  ('Energy Boost', 'Activa tu día', 'Intermedio', 22000),
  ('After Work Ride', 'Suelta el día', 'Todos los niveles', 22000),
  ('Sunset Sprint', 'La favorita', 'Avanzado', 22000),
  ('Night Climb', 'Cierre intenso', 'Avanzado', 22000),
  ('Saturday Sweat', 'Especial fin de semana', 'Todos los niveles', 24000),
  ('Weekend Marathon', 'Sesión extendida', 'Avanzado', 24000)
on conflict do nothing;

-- Bicicletas (4 filas × 6 columnas = 24 bikes; 7-10 son "populares" por estar al centro frente al instructor)
do $$
declare r int;
declare c int;
declare n int := 0;
begin
  for r in 1..4 loop
    for c in 1..6 loop
      n := n + 1;
      insert into bikes (number, bike_row, bike_col, is_popular)
      values (n, r, c, n in (7, 8, 9, 10))
      on conflict (number) do nothing;
    end loop;
  end loop;
end $$;

-- Planes
insert into plans (name, slug, description, price_cents, classes_included, validity_days, recurring, popular) values
  ('Clase suelta', 'clase-suelta', 'Para probar sin compromiso', 22000, 1, null, false, false),
  ('Pack 5 clases', 'pack-5', 'El favorito de la comunidad', 95000, 5, 30, false, true),
  ('Mensualidad', 'mensualidad', 'Para los que viven en la bici', 240000, null, 30, true, false)
on conflict do nothing;

-- Schedule slots: lun-vie con Rosario (mañana) y Lucia (tarde); sáb con Elmer
-- (Insertarlos requiere conocer los UUIDs generados, lo hacemos via subquery)
do $$
declare ros_id uuid := (select id from instructors where short_name = 'Rosario M.');
declare luc_id uuid := (select id from instructors where short_name = 'Lucia F.');
declare elm_id uuid := (select id from instructors where short_name = 'Elmer A.');
declare sun_id uuid := (select id from classes where title = 'Sunrise Ride');
declare pow_id uuid := (select id from classes where title = 'Power Up');
declare ene_id uuid := (select id from classes where title = 'Energy Boost');
declare aft_id uuid := (select id from classes where title = 'After Work Ride');
declare sst_id uuid := (select id from classes where title = 'Sunset Sprint');
declare ngh_id uuid := (select id from classes where title = 'Night Climb');
declare sat_id uuid := (select id from classes where title = 'Saturday Sweat');
declare wmt_id uuid := (select id from classes where title = 'Weekend Marathon');
declare d int;
begin
  -- Lun a Vie (1-5): mañanas con Rosario, tardes con Lucia
  for d in 1..5 loop
    insert into schedule_slots (class_id, instructor_id, day_of_week, start_time)
    values
      (sun_id, ros_id, d, '06:00'),
      (pow_id, ros_id, d, '07:00'),
      (ene_id, ros_id, d, '08:00'),
      (aft_id, luc_id, d, '17:00'),
      (sst_id, luc_id, d, '18:00'),
      (ngh_id, luc_id, d, '19:00')
    on conflict do nothing;
  end loop;

  -- Sábado (6): Elmer
  insert into schedule_slots (class_id, instructor_id, day_of_week, start_time)
  values
    (sat_id, elm_id, 6, '09:00'),
    (wmt_id, elm_id, 6, '10:00')
  on conflict do nothing;
end $$;

-- ============================================================
-- DONE. Total: 3 instructores, 8 clases, 24 bikes, 3 planes, 32 slots/semana.
-- ============================================================
