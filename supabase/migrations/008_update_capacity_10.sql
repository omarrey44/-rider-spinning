-- Update capacity 12 → 10 (studio layout: row 1=4, row 2=3, row 3=3)
alter table schedule_slots
  alter column capacity set default 10;

update schedule_slots
  set capacity = 10
  where capacity = 12;
