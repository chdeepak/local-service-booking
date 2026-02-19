-- Optional: Migration for Booking Status Change Audit Trail
-- This migration creates a table to track all booking status changes
-- Useful for auditing and debugging the booking flow

CREATE TABLE IF NOT EXISTS booking_status_history (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by VARCHAR(255),
  reason VARCHAR(500),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Create index for fast lookups
CREATE INDEX idx_booking_status_history_booking_id ON booking_status_history(booking_id);
CREATE INDEX idx_booking_status_history_changed_at ON booking_status_history(changed_at);

-- Example query to see status history for a booking
SELECT 
  booking_id,
  old_status,
  new_status,
  changed_at,
  changed_by,
  reason
FROM booking_status_history
WHERE booking_id = 1
ORDER BY changed_at DESC;

-- Example query to see all status changes in last 24 hours
SELECT 
  b.id,
  b.status as current_status,
  bsh.old_status,
  bsh.new_status,
  bsh.changed_at,
  p.name as provider_name,
  u.name as user_name
FROM booking_status_history bsh
JOIN bookings b ON bsh.booking_id = b.id
JOIN providers p ON b.provider_id = p.id
JOIN users u ON b.user_id = u.id
WHERE bsh.changed_at >= NOW() - INTERVAL '24 hours'
ORDER BY bsh.changed_at DESC;
