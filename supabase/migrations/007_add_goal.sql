-- Add goal column to bookings for customer fitness purpose
alter table bookings
add column if not exists goal text;
