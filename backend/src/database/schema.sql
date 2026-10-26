-- Module 1: Staff Identification & Bed-Zone Access Database Schema

CREATE TABLE IF NOT EXISTS staff (
  staff_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Doctor', 'Nurse', 'Supervisor', 'Other')),
  badge_uid TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'REVOKED', 'INACTIVE')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bed_zones (
  bed_zone_id TEXT PRIMARY KEY,
  ward_type TEXT NOT NULL CHECK(ward_type IN ('ICU', 'GENERAL_WARD')),
  ward_name TEXT NOT NULL,
  bed_number TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ONLINE' CHECK(status IN ('ONLINE', 'OFFLINE')),
  last_staff_id TEXT,
  last_staff_name TEXT,
  last_role TEXT,
  last_access_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  device_type TEXT NOT NULL DEFAULT 'ESP32_RFID',
  bed_zone_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ONLINE' CHECK(status IN ('ONLINE', 'OFFLINE')),
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_events (
  event_id TEXT PRIMARY KEY,
  staff_id TEXT,
  staff_name TEXT,
  role TEXT,
  rfid_uid TEXT NOT NULL,
  bed_zone_id TEXT NOT NULL,
  ward_type TEXT NOT NULL,
  device_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'ACCESS_REQUEST',
  status TEXT NOT NULL CHECK(status IN ('REGISTERED', 'UNKNOWN', 'REVOKED', 'INVALID_DEVICE')),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_badge ON staff(badge_uid);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON access_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_bed_zone ON access_events(bed_zone_id);
CREATE INDEX IF NOT EXISTS idx_events_device ON access_events(device_id);
