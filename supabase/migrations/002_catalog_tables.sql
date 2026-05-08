-- ============================================================
-- RIDEON SPINNING — Catálogo dinámico (instructores + horarios)
-- Migración aditiva: NO toca la tabla bookings.
-- Ejecuta en SQL Editor → New query → pega → Run
-- ============================================================

-- ====== INSTRUCTORES ======
create table if not exists instructors (
  id uuid primary key default gen_random_uuid(),
  full_name   text not null,                       -- "Rosario González Muñoz"
  short_name  text not null,                       -- "Rosario M." (uso compacto)
  initial     char(1) not null,                    -- "R" (avatar)
  avatar_class text not null
    check (avatar_class in ('avatar-rosario', 'avatar-lucia', 'avatar-elmer')),
  bio        text,
  photo_url  text,
  active     boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz default now()
);

-- ====== SCHEDULE SLOTS (horarios recurrentes semanales) ======
create table if not exists schedule_slots (
  id uuid primary key default gen_random_uuid(),

  -- Cuándo
  day_of_week  int not null check (day_of_week between 0 and 6),  -- 0=dom, 1=lun, ..., 6=sáb
  start_hour   int not null check (start_hour between 0 and 23),  -- formato 24h: 6, 17, ...
  start_minute int not null default 0 check (start_minute between 0 and 59),
  duration_min int not null default 60,

  -- Clase
  class_title text not null,                                       -- "Sunrise Ride"
  class_color text not null,                                       -- "sunrise" (CSS class)
  level text not null
    check (level in ('Principiante', 'Intermedio', 'Avanzado', 'Todos los niveles')),

  -- Quién
  instructor_id uuid not null references instructors(id) on delete restrict,

  -- Económico / capacidad
  price_cents int not null default 22000,                          -- 22000 = $220.00 MXN
  capacity    int not null default 24,

  active boolean not null default true,
  created_at timestamptz default now()
);

-- Solo un slot ACTIVO puede ocupar (día, hora). Permite desactivar y crear reemplazo.
create unique index if not exists uniq_active_slot
  on schedule_slots (day_of_week, start_hour, start_minute)
  where active = true;

-- Index de lectura ordenada (la pantalla los pide ordenados por día y hora)
create index if not exists idx_slots_listing
  on schedule_slots (day_of_week, start_hour, start_minute)
  where active = true;

-- ====== ROW LEVEL SECURITY ======
alter table instructors    enable row level security;
alter table schedule_slots enable row level security;

-- Lectura pública SOLO de filas activas (el browser usa anon key)
drop policy if exists "Public read active instructors" on instructors;
create policy "Public read active instructors"
  on instructors for select
  to anon, authenticated
  using (active = true);

drop policy if exists "Public read active slots" on schedule_slots;
create policy "Public read active slots"
  on schedule_slots for select
  to anon, authenticated
  using (active = true);

-- Escritura: nadie desde el cliente. Service role bypassa RLS.

-- ============================================================
-- SEEDS — datos actuales del proyecto
-- ============================================================

-- Instructores (3)
insert into instructors (full_name, short_name, initial, avatar_class, bio, display_order) values
  ('Rosario González Muñoz', 'Rosario M.', 'R', 'avatar-rosario',
   'El mejor regalo que te puedes dar es empezar el día moviéndote.', 1),
  ('Lucía Frescas González',  'Lucía F.',   'L', 'avatar-lucia',
   'Después del trabajo, tu cuerpo merece soltar el día.',           2),
  ('Elmer Alsides',            'Elmer A.',   'E', 'avatar-elmer',
   'El fin de semana es para ti. Sube a la bici y disfruta.',         3)
on conflict do nothing;

-- Slots: 6 horarios × 5 días entre semana (lun-vie) + 2 horarios sábado = 32 slots
do $$
declare ros_id uuid := (select id from instructors where short_name = 'Rosario M.');
declare luc_id uuid := (select id from instructors where short_name = 'Lucía F.');
declare elm_id uuid := (select id from instructors where short_name = 'Elmer A.');
declare d int;
begin
  -- Lunes a Viernes: 6 slots cada día
  for d in 1..5 loop
    insert into schedule_slots (day_of_week, start_hour, start_minute, class_title, class_color, level, instructor_id, price_cents)
    values
      (d, 6,  0, 'Sunrise Ride',     'sunrise',   'Principiante',         ros_id, 22000),
      (d, 7,  0, 'Power Up',         'power',     'Intermedio',           ros_id, 22000),
      (d, 8,  0, 'Energy Boost',     'energy',    'Intermedio',           ros_id, 22000),
      (d, 17, 0, 'After Work Ride',  'afterwork', 'Todos los niveles',    luc_id, 22000),
      (d, 18, 0, 'Sunset Sprint',    'sunset',    'Avanzado',             luc_id, 22000),
      (d, 19, 0, 'Night Climb',      'night',     'Avanzado',             luc_id, 22000)
    on conflict do nothing;
  end loop;

  -- Sábado (6): 2 slots especiales
  insert into schedule_slots (day_of_week, start_hour, start_minute, class_title, class_color, level, instructor_id, price_cents)
  values
    (6,  9, 0, 'Saturday Sweat',   'sweat',    'Todos los niveles', elm_id, 24000),
    (6, 10, 0, 'Weekend Marathon', 'marathon', 'Avanzado',          elm_id, 24000)
  on conflict do nothing;
end $$;

-- ============================================================
-- DONE. Total: 2 tablas, 3 instructores, 32 slots, RLS pública SELECT.
-- ============================================================
