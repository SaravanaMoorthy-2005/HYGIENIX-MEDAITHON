const db = require('../database/db');
const { broadcastEvent } = require('../sockets/socketHandler');
const config = require('../config');

// In-memory cache for duplicate scan debouncing
// Key: `${rfid_uid}_${bed_zone_id}`, Value: timestamp in ms
const recentScans = new Map();

function generateEventId() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EVT-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

function handleRfidScan(req, res) {
  try {
    let { device_id, bed_zone_id, rfid_uid, event_type = 'ACCESS_REQUEST' } = req.body;

    // STEP 1: Validate request parameters
    if (!device_id || !bed_zone_id || !rfid_uid) {
      return res.status(400).json({
        success: false,
        status: 'VALIDATION_ERROR',
        message: 'device_id, bed_zone_id, and rfid_uid are required'
      });
    }

    device_id = String(device_id).trim();
    bed_zone_id = String(bed_zone_id).trim();
    rfid_uid = String(rfid_uid).trim().toUpperCase();

    // STEP 2: Check whether device exists
    const device = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(device_id);
    if (!device) {
      // Store event as INVALID_DEVICE for security audit
      const eventId = generateEventId();
      const insertAudit = db.prepare(`
        INSERT INTO access_events (event_id, staff_id, staff_name, role, rfid_uid, bed_zone_id, ward_type, device_id, event_type, status, timestamp)
        VALUES (?, NULL, 'Unregistered Device', NULL, ?, ?, 'UNKNOWN', ?, ?, 'INVALID_DEVICE', datetime('now'))
      `);
      insertAudit.run(eventId, rfid_uid, bed_zone_id, device_id, event_type);

      const eventPayload = {
        event_id: eventId,
        staff_id: null,
        staff_name: 'Unregistered Device',
        role: null,
        rfid_uid,
        bed_zone_id,
        ward_type: 'UNKNOWN',
        device_id,
        event_type,
        status: 'INVALID_DEVICE',
        timestamp: new Date().toISOString()
      };
      broadcastEvent('access_event', eventPayload);

      return res.status(403).json({
        success: false,
        status: 'INVALID_DEVICE',
        message: 'Device is not registered'
      });
    }

    // Update device last_seen and status
    db.prepare(`UPDATE devices SET last_seen = datetime('now'), status = 'ONLINE' WHERE device_id = ?`).run(device_id);

    // STEP 3: Check whether bed_zone_id exists and belongs to device_id
    const bedZone = db.prepare('SELECT * FROM bed_zones WHERE bed_zone_id = ?').get(bed_zone_id);
    if (!bedZone || bedZone.device_id !== device_id) {
      return res.status(400).json({
        success: false,
        status: 'BED_DEVICE_MISMATCH',
        message: `Bed zone ${bed_zone_id} does not match device ${device_id}`
      });
    }

    // DEBOUNCE / COOLDOWN CHECK
    const debounceKey = `${rfid_uid}_${bed_zone_id}`;
    const now = Date.now();
    const lastScanTime = recentScans.get(debounceKey);
    const cooldownMs = config.scanCooldownSeconds * 1000;

    if (lastScanTime && (now - lastScanTime) < cooldownMs) {
      const remainingSec = (((cooldownMs - (now - lastScanTime)) / 1000).toFixed(1));
      console.log(`[RFID Debounce] Card ${rfid_uid} at ${bed_zone_id} ignored (cooldown: ${remainingSec}s remaining)`);
      return res.status(200).json({
        success: true,
        status: 'DEBOUNCED',
        message: `Duplicate scan ignored (cooldown active: ${remainingSec}s left)`
      });
    }

    // Set cooldown timestamp
    recentScans.set(debounceKey, now);

    // Clean up old entries in recentScans
    if (recentScans.size > 200) {
      for (const [key, ts] of recentScans.entries()) {
        if (now - ts > cooldownMs * 2) {
          recentScans.delete(key);
        }
      }
    }

    // STEP 4: Search staff by RFID UID
    const staff = db.prepare('SELECT * FROM staff WHERE UPPER(badge_uid) = ?').get(rfid_uid);

    // STEP 5: Check staff status
    let outcomeStatus = 'UNKNOWN';
    let responsePayload = {};
    let isSuccess = false;

    if (!staff) {
      outcomeStatus = 'UNKNOWN';
      isSuccess = false;
      responsePayload = {
        success: false,
        status: 'UNKNOWN',
        message: 'Unknown or unregistered RFID card'
      };
    } else if (staff.status === 'REVOKED') {
      outcomeStatus = 'REVOKED';
      isSuccess = false;
      responsePayload = {
        success: false,
        status: 'REVOKED',
        message: 'RFID card is revoked'
      };
    } else if (staff.status === 'INACTIVE') {
      outcomeStatus = 'REVOKED';
      isSuccess = false;
      responsePayload = {
        success: false,
        status: 'REVOKED',
        message: 'Staff profile is inactive'
      };
    } else {
      // ACTIVE staff
      outcomeStatus = 'REGISTERED';
      isSuccess = true;
      responsePayload = {
        success: true,
        status: 'REGISTERED',
        staff: {
          staff_id: staff.staff_id,
          name: staff.name,
          role: staff.role
        },
        bed_zone: {
          bed_zone_id: bedZone.bed_zone_id,
          ward_type: bedZone.ward_type
        },
        message: 'Access request recorded'
      };
    }

    // STEP 6: Create an access event in database
    const eventId = generateEventId();
    const insertEvent = db.prepare(`
      INSERT INTO access_events (
        event_id, staff_id, staff_name, role, rfid_uid,
        bed_zone_id, ward_type, device_id, event_type, status, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertEvent.run(
      eventId,
      staff ? staff.staff_id : null,
      staff ? staff.name : 'Unknown Staff',
      staff ? staff.role : null,
      rfid_uid,
      bed_zone_id,
      bedZone.ward_type,
      device_id,
      event_type,
      outcomeStatus
    );

    // If REGISTERED, update bed_zones presence
    if (outcomeStatus === 'REGISTERED') {
      db.prepare(`
        UPDATE bed_zones
        SET last_staff_id = ?,
            last_staff_name = ?,
            last_role = ?,
            last_access_time = datetime('now'),
            status = 'ONLINE',
            updated_at = datetime('now')
        WHERE bed_zone_id = ?
      `).run(staff.staff_id, staff.name, staff.role, bed_zone_id);
    }

    // Retrieve saved event record
    const savedEvent = db.prepare('SELECT * FROM access_events WHERE event_id = ?').get(eventId);
    const updatedBed = db.prepare('SELECT * FROM bed_zones WHERE bed_zone_id = ?').get(bed_zone_id);

    // STEP 7: Broadcast real-time updates via Socket.IO
    broadcastEvent('access_event', savedEvent);
    if (outcomeStatus === 'REGISTERED') {
      broadcastEvent('bed_update', updatedBed);
    }

    console.log(`[RFID Scan] Result: ${outcomeStatus} | Card: ${rfid_uid} | Bed: ${bed_zone_id} | Device: ${device_id} | Staff: ${staff ? staff.name : 'None'}`);

    // STEP 8: Return JSON response to ESP32 / caller
    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error('[RFID Scan Error]:', error);
    return res.status(500).json({
      success: false,
      status: 'INTERNAL_ERROR',
      message: 'Failed to process RFID scan event'
    });
  }
}

module.exports = {
  handleRfidScan
};
