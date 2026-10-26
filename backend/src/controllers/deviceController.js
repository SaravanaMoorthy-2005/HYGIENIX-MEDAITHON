const db = require('../database/db');
const { broadcastEvent } = require('../sockets/socketHandler');

function getAllDevices(req, res) {
  try {
    // Optionally calculate dynamic OFFLINE status if last_seen > 2 minutes
    const devices = db.prepare(`
      SELECT 
        d.device_id,
        d.device_type,
        d.bed_zone_id,
        bz.ward_type,
        bz.ward_name,
        d.status,
        d.last_seen,
        d.created_at,
        CASE 
          WHEN (strftime('%s', 'now') - strftime('%s', d.last_seen)) > 120 THEN 'OFFLINE'
          ELSE d.status
        END as current_health_status
      FROM devices d
      LEFT JOIN bed_zones bz ON d.bed_zone_id = bz.bed_zone_id
      ORDER BY d.device_id ASC
    `).all();

    return res.json({ success: true, count: devices.length, data: devices });
  } catch (error) {
    console.error('[Devices Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch devices' });
  }
}

function handleHeartbeat(req, res) {
  try {
    let { device_id, status = 'ONLINE' } = req.body;

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: 'device_id is required'
      });
    }

    device_id = String(device_id).trim();
    status = String(status).trim().toUpperCase();

    const device = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(device_id);
    if (!device) {
      return res.status(404).json({
        success: false,
        status: 'INVALID_DEVICE',
        message: `Device ${device_id} is not registered in system`
      });
    }

    db.prepare(`
      UPDATE devices
      SET status = ?, last_seen = datetime('now')
      WHERE device_id = ?
    `).run(status, device_id);

    // If bed exists, ensure bed status matches
    if (device.bed_zone_id) {
      db.prepare(`
        UPDATE bed_zones
        SET status = ?, updated_at = datetime('now')
        WHERE bed_zone_id = ?
      `).run(status, device.bed_zone_id);
    }

    const updatedDevice = db.prepare('SELECT * FROM devices WHERE device_id = ?').get(device_id);
    broadcastEvent('device_heartbeat', updatedDevice);

    return res.json({
      success: true,
      message: 'Heartbeat acknowledged',
      data: updatedDevice
    });
  } catch (error) {
    console.error('[Heartbeat Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process device heartbeat' });
  }
}

module.exports = {
  getAllDevices,
  handleHeartbeat
};
