const db = require('./db');

function seedDatabase(force = false) {
  console.log('[Seed] Checking database seeding...');

  if (force) {
    db.exec(`
      DELETE FROM access_events;
      DELETE FROM bed_zones;
      DELETE FROM devices;
      DELETE FROM staff;
    `);
    console.log('[Seed] Cleared existing records.');
  }

  // 1. Seed Staff
  const insertStaff = db.prepare(`
    INSERT OR REPLACE INTO staff (staff_id, name, role, badge_uid, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const staffData = [
    ['STF001', 'Dr. Arun Kumar', 'Doctor', 'A1B2C3D4', 'ACTIVE'],
    ['STF002', 'Nurse Priya', 'Nurse', 'B1C2D3E4', 'ACTIVE'],
    ['STF003', 'Dr. Ravi', 'Doctor', 'C1D2E3F4', 'ACTIVE'],
    ['STF004', 'Nurse Meena', 'Nurse', 'D1E2F3A4', 'ACTIVE'],
    ['STF005', 'Supervisor James', 'Supervisor', 'E1F2A3B4', 'ACTIVE'],
    ['STF006', 'Dr. Sarah Jenkins (Revoked Demo)', 'Doctor', 'REV00112', 'REVOKED']
  ];

  const seedStaffTx = db.transaction((rows) => {
    for (const row of rows) {
      insertStaff.run(...row);
    }
  });
  seedStaffTx(staffData);

  // 2. Seed Devices
  const insertDevice = db.prepare(`
    INSERT OR REPLACE INTO devices (device_id, device_type, bed_zone_id, status, last_seen, created_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const deviceData = [
    ['ESP32-ICU-01', 'ESP32_RFID', 'ICU-01', 'ONLINE'],
    ['ESP32-ICU-02', 'ESP32_RFID', 'ICU-02', 'ONLINE'],
    ['ESP32-ICU-03', 'ESP32_RFID', 'ICU-03', 'ONLINE'],
    ['ESP32-GW-01', 'ESP32_RFID', 'GW-01', 'ONLINE'],
    ['ESP32-GW-02', 'ESP32_RFID', 'GW-02', 'ONLINE'],
    ['ESP32-GW-03', 'ESP32_RFID', 'GW-03', 'ONLINE']
  ];

  const seedDeviceTx = db.transaction((rows) => {
    for (const row of rows) {
      insertDevice.run(...row);
    }
  });
  seedDeviceTx(deviceData);

  // 3. Seed Bed Zones
  const insertBed = db.prepare(`
    INSERT OR REPLACE INTO bed_zones (bed_zone_id, ward_type, ward_name, bed_number, device_id, status, last_staff_id, last_staff_name, last_role, last_access_time, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now'), datetime('now'))
  `);

  const bedData = [
    ['ICU-01', 'ICU', 'ICU', '01', 'ESP32-ICU-01', 'ONLINE', 'STF001', 'Dr. Arun Kumar', 'Doctor', '-15 minutes'],
    ['ICU-02', 'ICU', 'ICU', '02', 'ESP32-ICU-02', 'ONLINE', null, null, null, null],
    ['ICU-03', 'ICU', 'ICU', '03', 'ESP32-ICU-03', 'ONLINE', 'STF002', 'Nurse Priya', 'Nurse', '-8 minutes'],
    ['GW-01', 'GENERAL_WARD', 'General Ward', '01', 'ESP32-GW-01', 'ONLINE', 'STF003', 'Dr. Ravi', 'Doctor', '-4 minutes'],
    ['GW-02', 'GENERAL_WARD', 'General Ward', '02', 'ESP32-GW-02', 'ONLINE', null, null, null, null],
    ['GW-03', 'GENERAL_WARD', 'General Ward', '03', 'ESP32-GW-03', 'ONLINE', null, null, null, null]
  ];

  const seedBedsTx = db.transaction((rows) => {
    for (const row of rows) {
      insertBed.run(
        row[0], row[1], row[2], row[3], row[4], row[5],
        row[6], row[7], row[8], row[9]
      );
    }
  });
  seedBedsTx(bedData);

  // 4. Seed Initial Access Events
  const insertEvent = db.prepare(`
    INSERT OR REPLACE INTO access_events (event_id, staff_id, staff_name, role, rfid_uid, bed_zone_id, ward_type, device_id, event_type, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const initialEvents = [
    ['EVT-INIT-001', 'STF001', 'Dr. Arun Kumar', 'Doctor', 'A1B2C3D4', 'ICU-01', 'ICU', 'ESP32-ICU-01', 'ACCESS_REQUEST', 'REGISTERED', '-15 minutes'],
    ['EVT-INIT-002', 'STF002', 'Nurse Priya', 'Nurse', 'B1C2D3E4', 'ICU-03', 'ICU', 'ESP32-ICU-03', 'ACCESS_REQUEST', 'REGISTERED', '-8 minutes'],
    ['EVT-INIT-003', 'STF003', 'Dr. Ravi', 'Doctor', 'C1D2E3F4', 'GW-01', 'GENERAL_WARD', 'ESP32-GW-01', 'ACCESS_REQUEST', 'REGISTERED', '-4 minutes'],
    ['EVT-INIT-004', null, 'Unknown Staff', null, '7890ABCD', 'ICU-02', 'ICU', 'ESP32-ICU-02', 'ACCESS_REQUEST', 'UNKNOWN', '-2 minutes']
  ];

  const seedEventsTx = db.transaction((rows) => {
    for (const row of rows) {
      insertEvent.run(
        row[0], row[1], row[2], row[3], row[4], row[5],
        row[6], row[7], row[8], row[9], row[10]
      );
    }
  });
  seedEventsTx(initialEvents);

  console.log('[Seed] Database successfully seeded with Staff, Beds, Devices, and Demo Events.');
}

if (require.main === module) {
  seedDatabase(true);
}

module.exports = seedDatabase;
