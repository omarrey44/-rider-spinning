-- Add confirmation_number column to bookings for customer reference
alter table bookings
add column if not exists confirmation_number varchar(8) unique;

-- Create index for lookups by confirmation number
create index if not exists idx_bookings_confirmation_number
  on bookings (confirmation_number);
