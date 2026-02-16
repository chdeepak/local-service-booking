-- Migration: Create availability table
-- Run this on your PostgreSQL database before deploying

CREATE TABLE IF NOT EXISTS availability (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  slot_start TIMESTAMP NOT NULL,
  slot_end TIMESTAMP NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_availability_provider_id ON availability(provider_id);
CREATE INDEX idx_availability_slot_start ON availability(slot_start);
CREATE INDEX idx_availability_is_booked ON availability(is_booked);
