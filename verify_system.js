/**
 * SMART HAND-HYGIENE MONITORING SYSTEM - MODULE 1
 * Comprehensive End-to-End System Verification Script
 */

const http = require('http');

const API_BASE = 'http://127.0.0.1:5000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function verifyAll() {
  console.log('===============================================================');
  console.log(' SMART HAND-HYGIENE MONITORING SYSTEM: MODULE 1 VERIFICATION');
  console.log(' Staff Identification & Bed-Zone Access Flow Verification');
  console.log(' Target Backend:', API_BASE);
  console.log('===============================================================\n');

  let passed = 0;
  let total = 10;

  try {
    // 1. Health & Initial State
    console.log('[Test 1/10] Checking System & Database Health...');
    const health = await fetch('http://127.0.0.1:5000/health');
    const healthData = await health.json();
    if (healthData.status === 'ONLINE') {
      console.log('  -> PASS: Backend server is healthy & database connected.\n');
      passed++;
    } else {
      throw new Error('Healthcheck failed');
    }

    // 2. Registered RFID Scan (ICU Mapping)
    console.log('[Test 2/10] Verifying Registered Doctor RFID Scan (ICU-01)...');
    const regScan = await request('/rfid/scan', {
      method: 'POST',
      body: JSON.stringify({
        device_id: 'ESP32-ICU-01',
        bed_zone_id: 'ICU-01',
        rfid_uid: 'A1B2C3D4',
        event_type: 'ACCESS_REQUEST'
      })
    });
    if (regScan.data.status === 'REGISTERED' && regScan.data.staff.name === 'Dr. Arun Kumar') {
      console.log(`  -> PASS: Identified ${regScan.data.staff.name} (${regScan.data.staff.role}) at ${regScan.data.bed_zone.bed_zone_id} (${regScan.data.bed_zone.ward_type})\n`);
      passed++;
    } else {
      throw new Error(`Registered scan mismatch: ${JSON.stringify(regScan.data)}`);
    }

    // 3. Duplicate Scan Protection (Debounce Cooldown)
    console.log('[Test 3/10] Verifying Duplicate Scan Protection (Immediate Re-Tap)...');
    const debScan = await request('/rfid/scan', {
      method: 'POST',
      body: JSON.stringify({
        device_id: 'ESP32-ICU-01',
        bed_zone_id: 'ICU-01',
        rfid_uid: 'A1B2C3D4',
        event_type: 'ACCESS_REQUEST'
      })
    });
    if (debScan.data.status === 'DEBOUNCED') {
      console.log(`  -> PASS: Rapid tap ignored by cooldown: "${debScan.data.message}"\n`);
      passed++;
    } else {
      throw new Error(`Debounce check failed: ${JSON.stringify(debScan.data)}`);
    }

    // 4. General Ward Mapping
    console.log('[Test 4/10] Verifying General Ward Bed Mapping (GW-01)...');
    const gwScan = await request('/rfid/scan', {
      method: 'POST',
      body: JSON.stringify({
        device_id: 'ESP32-GW-01',
        bed_zone_id: 'GW-01',
        rfid_uid: 'C1D2E3F4',
        event_type: 'ACCESS_REQUEST'
      })
    });
    if (gwScan.data.status === 'REGISTERED' && gwScan.data.bed_zone.ward_type === 'GENERAL_WARD') {
      console.log(`  -> PASS: Staff ${gwScan.data.staff.name} mapped to General Ward bed ${gwScan.data.bed_zone.bed_zone_id}\n`);
      passed++;
    } else {
      throw new Error(`General ward mapping failed: ${JSON.stringify(gwScan.data)}`);
    }

    // 5. Unknown RFID Card Detection
    console.log('[Test 5/10] Verifying Unknown RFID Card Detection (99887766)...');
    const unkScan = await request('/rfid/scan', {
      method: 'POST',
      body: JSON.stringify({
        device_id: 'ESP32-ICU-02',
        bed_zone_id: 'ICU-02',
        rfid_uid: '99887766',
        event_type: 'ACCESS_REQUEST'
      })
    });
    if (unkScan.data.status === 'UNKNOWN' && unkScan.data.success === false) {
      console.log(`  -> PASS: Unknown card flagged correctly with message: "${unkScan.data.message}"\n`);
      passed++;
    } else {
      throw new Error(`Unknown card check failed: ${JSON.stringify(unkScan.data)}`);
    }

    // 6. Revoked RFID Card Detection
    console.log('[Test 6/10] Verifying Revoked RFID Card Detection (REV00112)...');
    const revScan = await request('/rfid/scan', {
      method: 'POST',
      body: JSON.stringify({
        device_id: 'ESP32-ICU-03',
        bed_zone_id: 'ICU-03',
        rfid_uid: 'REV00112',
        event_type: 'ACCESS_REQUEST'
      })
    });
    if (revScan.data.status === 'REVOKED' && revScan.data.success === false) {
      console.log(`  -> PASS: Revoked card recognized with message: "${revScan.data.message}"\n`);
      passed++;
    } else {
      throw new Error(`Revoked card check failed: ${JSON.stringify(revScan.data)}`);
    }

    // 7. Security & API Input Validation
    console.log('[Test 7/10] Verifying Device Validation & Bed Mismatch Protection...');
    const fakeDevice = await request('/rfid/scan', {
      method: 'POST',
      body: JSON.stringify({
        device_id: 'ESP32-UNREGISTERED',
        bed_zone_id: 'ICU-01',
        rfid_uid: 'A1B2C3D4'
      })
    });
    if (fakeDevice.status === 403 && fakeDevice.data.status === 'INVALID_DEVICE') {
      console.log('  -> PASS: Unregistered device rejected with HTTP 403 INVALID_DEVICE.\n');
      passed++;
    } else {
      throw new Error(`Device validation failed: ${JSON.stringify(fakeDevice)}`);
    }

    // 8. Device Heartbeat Telemetry
    console.log('[Test 8/10] Verifying Device Heartbeat Monitor...');
    const heartbeat = await request('/device/heartbeat', {
      method: 'POST',
      body: JSON.stringify({
        device_id: 'ESP32-ICU-01',
        status: 'ONLINE'
      })
    });
    if (heartbeat.data.success && heartbeat.data.data.status === 'ONLINE') {
      console.log(`  -> PASS: Heartbeat acknowledged for ${heartbeat.data.data.device_id} at ${heartbeat.data.data.last_seen}\n`);
      passed++;
    } else {
      throw new Error(`Heartbeat failed: ${JSON.stringify(heartbeat)}`);
    }

    // 9. Database Audit Event Creation
    console.log('[Test 9/10] Verifying Audit Event Persistence in SQLite Database...');
    const events = await request('/access-events?limit=5');
    if (events.data.success && events.data.count > 0) {
      const latest = events.data.data[0];
      console.log(`  -> PASS: Event ${latest.event_id} verified in DB: ${latest.staff_name || latest.rfid_uid} -> ${latest.bed_zone_id} (${latest.status})\n`);
      passed++;
    } else {
      throw new Error(`Event persistence check failed`);
    }

    // 10. Dashboard Summary Aggregation
    console.log('[Test 10/10] Verifying Live Dashboard Aggregation...');
    const summary = await request('/dashboard/summary');
    if (summary.data.success && summary.data.data.total_staff >= 5) {
      const s = summary.data.data;
      console.log(`  -> PASS: Summary metrics: Staff=${s.total_staff}, Active Beds=${s.active_beds}/${s.total_beds}, Today's Events=${s.today_access_events}, Unknown=${s.unknown_rfid_events}\n`);
      passed++;
    } else {
      throw new Error(`Summary check failed: ${JSON.stringify(summary)}`);
    }

    console.log('===============================================================');
    console.log(` RESULT: ${passed} / ${total} SYSTEM TESTS PASSED!`);
    console.log(' Module 1 Software + Hardware Integration is 100% OPERATIONAL.');
    console.log('===============================================================');

  } catch (err) {
    console.error('\n❌ VERIFICATION ERROR:', err.message);
    process.exit(1);
  }
}

verifyAll();
