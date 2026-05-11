-- ============================================================
-- RIDEON SPINNING — Waitlist (lista de espera pre-launch)
-- Captura emails antes del lanzamiento para notificación de apertura.
-- ============================================================

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  phone text,
  source text,                                -- "hero" | "footer" | "popup" | etc
  notified boolean default false,
  notified_at timestamptz,
  created_at timestamptz default now(),
  unique (lower(email))                       -- dedupe por email
);

create index if not exists idx_waitlist_email on waitlist (lower(email));
create index if not exists idx_waitlist_not_notified on waitlist (notified) where notified = false;

-- RLS: nadie escribe ni lee desde browser. API server-side con service_role.
alter table waitlist enable row level security;
