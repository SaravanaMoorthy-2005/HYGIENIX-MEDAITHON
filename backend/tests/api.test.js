const assert = require('assert');
const { app, server } = require('../src/server');
const seedDatabase = require('../src/database/seed');
const db = require('../src/database/db');

const PORT = 5055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log('--- STARTING MODULE 1 INTEGRATION TESTS ---');

  // Start server on test port
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Test server running at ${BASE_URL}`);

  try {
    // 0. Reset DB
    seedDatabase(true);

    // 1. Test Healthcheck
    {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.status, 'ONLINE');
      console.log('✓ Healthcheck passed');
    }

    // 2. Test Registered RFID Scan (Dr. Arun Kumar at ICU-01)
    {
      const res = await fetch(`${BASE_URL}/api/rfid/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32-ICU-01',
          bed_zone_id: 'ICU-01',
          rfid_uid: 'A1B2C3D4',
          event_type: 'ACCESS_REQUEST'
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'REGISTERED');
      assert.strictEqual(data.staff.staff_id, 'STF001');
      assert.strictEqual(data.staff.name, 'Dr. Arun Kumar');
      assert.strictEqual(data.staff.role, 'Doctor');
      assert.strictEqual(data.bed_zone.bed_zone_id, 'ICU-01');
      assert.strictEqual(data.bed_zone.ward_type, 'ICU');
      console.log('✓ Registered RFID scan passed (ICU mapping & staff match)');
    }

    // 3. Test Duplicate Scan Protection (Cooldown)
    {
      // Tap immediately again within cooldown window
      const res = await fetch(`${BASE_URL}/api/rfid/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32-ICU-01',
          bed_zone_id: 'ICU-01',
          rfid_uid: 'A1B2C3D4',
          event_type: 'ACCESS_REQUEST'
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.status, 'DEBOUNCED');
      assert.strictEqual(data.success, true);
      console.log('✓ Duplicate scan protection (debounce cooldown) passed');
    }

    // 4. Test General Ward Mapping (Dr. Ravi at GW-01)
    {
      const res = await fetch(`${BASE_URL}/api/rfid/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32-GW-01',
          bed_zone_id: 'GW-01',
          rfid_uid: 'C1D2E3F4',
          event_type: 'ACCESS_REQUEST'
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'REGISTERED');
      assert.strictEqual(data.staff.name, 'Dr. Ravi');
      assert.strictEqual(data.bed_zone.ward_type, 'GENERAL_WARD');
      console.log('✓ General Ward mapping passed');
    }

    // 5. Test Unknown RFID Card
    {
      const res = await fetch(`${BASE_URL}/api/rfid/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32-ICU-02',
          bed_zone_id: 'ICU-02',
          rfid_uid: '99887766',
          event_type: 'ACCESS_REQUEST'
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.status, 'UNKNOWN');
      assert.ok(data.message.includes('Unknown'));

      // Check DB recorded the event
      const eventInDb = db.prepare('SELECT * FROM access_events WHERE rfid_uid = ?').get('99887766');
      assert.ok(eventInDb);
      assert.strictEqual(eventInDb.status, 'UNKNOWN');
      console.log('✓ Unknown RFID card flow and DB recording passed');
    }

    // 6. Test Revoked RFID Card
    {
      const res = await fetch(`${BASE_URL}/api/rfid/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32-ICU-03',
          bed_zone_id: 'ICU-03',
          rfid_uid: 'REV00112',
          event_type: 'ACCESS_REQUEST'
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.status, 'REVOKED');

      // Check DB recorded revoked event
      const eventInDb = db.prepare('SELECT * FROM access_events WHERE rfid_uid = ?').get('REV00112');
      assert.ok(eventInDb);
      assert.strictEqual(eventInDb.status, 'REVOKED');
      console.log('✓ Revoked RFID card flow and DB recording passed');
    }

    // 7. Test Invalid Device
    {
      const res = await fetch(`${BASE_URL}/api/rfid/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32-FAKE-99',
          bed_zone_id: 'ICU-01',
          rfid_uid: 'A1B2C3D4'
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 403);
      assert.strictEqual(data.status, 'INVALID_DEVICE');
      console.log('✓ Invalid device rejection passed');
    }

    // 8. Test Bed-Device Mismatch
    {
      const res = await fetch(`${BASE_URL}/api/rfid/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32-ICU-01',
          bed_zone_id: 'GW-03', // mismatch
          rfid_uid: 'A1B2C3D4'
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.status, 'BED_DEVICE_MISMATCH');
      console.log('✓ Bed-device mismatch rejection passed');
    }

    // 9. Test Device Heartbeat
    {
      const res = await fetch(`${BASE_URL}/api/device/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32-ICU-01',
          status: 'ONLINE'
        })
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.status, 'ONLINE');
      console.log('✓ Device heartbeat update passed');
    }

    // 10. Test Staff API & Status Patching
    {
      // Add staff
      const addRes = await fetch(`${BASE_URL}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: 'STF999',
          name: 'Test Nurse Ananya',
          role: 'Nurse',
          badge_uid: 'TESTUID99',
          status: 'ACTIVE'
        })
      });
      const addData = await addRes.json();
      assert.strictEqual(addRes.status, 201);
      assert.strictEqual(addData.data.staff_id, 'STF999');

      // Update status to REVOKED
      const patchRes = await fetch(`${BASE_URL}/api/staff/STF999/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REVOKED' })
      });
      const patchData = await patchRes.json();
      assert.strictEqual(patchRes.status, 200);
      assert.strictEqual(patchData.data.status, 'REVOKED');
      console.log('✓ Staff creation & status patch passed');
    }

    // 11. Test Dashboard Summary & Events Queries
    {
      const summaryRes = await fetch(`${BASE_URL}/api/dashboard/summary`);
      const summary = await summaryRes.json();
      assert.strictEqual(summaryRes.status, 200);
      assert.ok(summary.data.total_staff >= 5);
      assert.ok(summary.data.active_beds >= 1);
      assert.ok(summary.data.today_access_events >= 3);
      assert.ok(summary.data.unknown_rfid_events >= 1);

      const eventsRes = await fetch(`${BASE_URL}/api/access-events?ward_type=ICU`);
      const eventsData = await eventsRes.json();
      assert.strictEqual(eventsRes.status, 200);
      assert.ok(eventsData.data.length > 0);
      assert.ok(eventsData.data.every(e => e.ward_type === 'ICU'));
      console.log('✓ Dashboard summary and ward-filtered event queries passed');
    }

    console.log('----------------------------------------------------');
    console.log(' ALL 11 INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
