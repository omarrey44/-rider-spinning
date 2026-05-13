-- Add class_date column to bookings for better date tracking
alter table bookings
add column if not exists class_date date;

-- Create index for date-based queries
create index if not exists idx_bookings_class_date
  on bookings (class_date);
