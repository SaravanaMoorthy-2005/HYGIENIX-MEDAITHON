const db = require('../database/db');
const { broadcastEvent } = require('../sockets/socketHandler');

function getAllBedZones(req, res) {
  try {
    const { ward_type } = req.query;
    let query = 'SELECT * FROM bed_zones WHERE 1=1';
    const params = [];

    if (ward_type && ward_type !== 'ALL') {
      query += ' AND ward_type = ?';
      params.push(ward_type);
    }

    query += ' ORDER BY ward_type ASC, bed_number ASC';
    const beds = db.prepare(query).all(...params);

    return res.json({ success: true, count: beds.length, data: beds });
  } catch (error) {
    console.error('[BedZones Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bed zones' });
  }
}

function createBedZone(req, res) {
  try {
    let { bed_zone_id, ward_type, ward_name, bed_number, device_id, status = 'ONLINE' } = req.body;

    if (!bed_zone_id || !ward_type || !ward_name || !bed_number || !device_id) {
      return res.status(400).json({
        success: false,
        message: 'bed_zone_id, ward_type, ward_name, bed_number, and device_id are required'
      });
    }

    bed_zone_id = String(bed_zone_id).trim();
    ward_type = String(ward_type).trim().toUpperCase();
    ward_name = String(ward_name).trim();
    bed_number = String(bed_number).trim();
    device_id = String(device_id).trim();

    if (!['ICU', 'GENERAL_WARD'].includes(ward_type)) {
      return res.status(400).json({
        success: false,
        message: 'ward_type must be either ICU or GENERAL_WARD'
      });
    }

    // Check existing bed_zone_id
    const existingBed = db.prepare('SELECT * FROM bed_zones WHERE bed_zone_id = ?').get(bed_zone_id);
    if (existingBed) {
      return res.status(409).json({
        success: false,
        message: `Bed zone ${bed_zone_id} already exists`
      });
    }

    // Check device assigned to another bed
    const existingDeviceBed = db.prepare('SELECT * FROM bed_zones WHERE device_id = ?').get(device_id);
    if (existingDeviceBed) {
      return res.status(409).json({
        success: false,
        message: `Device ${device_id} is already linked to bed zone ${existingDeviceBed.bed_zone_id}`
      });
    }

    // Ensure device exists or create it
    const existingDevice = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(device_id);
    if (!existingDevice) {
      db.prepare(`
        INSERT INTO devices (device_id, device_type, bed_zone_id, status, last_seen, created_at)
        VALUES (?, 'ESP32_RFID', ?, 'ONLINE', datetime('now'), datetime('now'))
      `).run(device_id, bed_zone_id);
    }

    const insertBed = db.prepare(`
      INSERT INTO bed_zones (bed_zone_id, ward_type, ward_name, bed_number, device_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    insertBed.run(bed_zone_id, ward_type, ward_name, bed_number, device_id, status);

    const createdBed = db.prepare('SELECT * FROM bed_zones WHERE bed_zone_id = ?').get(bed_zone_id);
    broadcastEvent('bed_created', createdBed);

    return res.status(201).json({
      success: true,
      message: 'Bed zone registered successfully',
      data: createdBed
    });
  } catch (error) {
    console.error('[Create BedZone Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create bed zone' });
  }
}

module.exports = {
  getAllBedZones,
  createBedZone
};
