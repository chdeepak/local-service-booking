-- Migration: Seed availability slots for each provider
-- Creates one-hour slots from 09:00 to 17:00 for the next month

INSERT INTO availability (provider_id, slot_start, slot_end)
SELECT
  p.id,
  (d.day + t.slot_time) AS slot_start,
  (d.day + t.slot_time + INTERVAL '1 hour') AS slot_end
FROM providers p
CROSS JOIN generate_series(
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 month' - INTERVAL '1 day',
  INTERVAL '1 day'
) AS d(day)
CROSS JOIN generate_series(
  '09:00'::time,
  '16:00'::time,
  INTERVAL '1 hour'
) AS t(slot_time);
