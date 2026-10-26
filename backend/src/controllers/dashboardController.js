const db = require('../database/db');

function getDashboardSummary(req, res) {
  try {
    // 1. Total Staff
    const totalStaffRow = db.prepare('SELECT COUNT(*) as count FROM staff WHERE status != ?').get('INACTIVE');
    const totalStaff = totalStaffRow ? totalStaffRow.count : 0;

    // 2. Active Beds (beds with recent activity or staff present)
    const activeBedsRow = db.prepare(`
      SELECT COUNT(*) as count FROM bed_zones 
      WHERE last_staff_id IS NOT NULL AND status = 'ONLINE'
    `).get();
    const activeBeds = activeBedsRow ? activeBedsRow.count : 0;

    const totalBedsRow = db.prepare('SELECT COUNT(*) as count FROM bed_zones').get();
    const totalBeds = totalBedsRow ? totalBedsRow.count : 0;

    // 3. Today's Access Events (since midnight)
    const todayEventsRow = db.prepare(`
      SELECT COUNT(*) as count FROM access_events 
      WHERE date(timestamp) = date('now')
    `).get();
    const todayEvents = todayEventsRow ? todayEventsRow.count : 0;

    // 4. Unknown RFID Events (all time or today)
    const unknownEventsRow = db.prepare(`
      SELECT COUNT(*) as count FROM access_events 
      WHERE status = 'UNKNOWN'
    `).get();
    const unknownEvents = unknownEventsRow ? unknownEventsRow.count : 0;

    // 5. Revoked events count
    const revokedEventsRow = db.prepare(`
      SELECT COUNT(*) as count FROM access_events 
      WHERE status = 'REVOKED'
    `).get();
    const revokedEvents = revokedEventsRow ? revokedEventsRow.count : 0;

    // 6. Ward breakdown
    const icuBeds = db.prepare("SELECT COUNT(*) as count FROM bed_zones WHERE ward_type = 'ICU'").get().count;
    const gwBeds = db.prepare("SELECT COUNT(*) as count FROM bed_zones WHERE ward_type = 'GENERAL_WARD'").get().count;

    return res.json({
      success: true,
      data: {
        total_staff: totalStaff,
        active_beds: activeBeds,
        total_beds: totalBeds,
        today_access_events: todayEvents,
        unknown_rfid_events: unknownEvents,
        revoked_rfid_events: revokedEvents,
        breakdown: {
          icu_beds: icuBeds,
          general_ward_beds: gwBeds
        }
      }
    });
  } catch (error) {
    console.error('[Dashboard Summary Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate dashboard summary' });
  }
}

function getAccessEvents(req, res) {
  try {
    const { ward_type, status, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM access_events WHERE 1=1';
    const params = [];

    if (ward_type && ward_type !== 'ALL') {
      query += ' AND ward_type = ?';
      params.push(ward_type);
    }

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const events = db.prepare(query).all(...params);

    const totalRow = db.prepare('SELECT COUNT(*) as count FROM access_events').get();

    return res.json({
      success: true,
      count: events.length,
      total: totalRow ? totalRow.count : 0,
      data: events
    });
  } catch (error) {
    console.error('[Access Events Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch access events' });
  }
}

function getRecentAccessEvents(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const events = db.prepare(`
      SELECT * FROM access_events 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit);

    return res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('[Recent Access Events Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recent access events' });
  }
}

module.exports = {
  getDashboardSummary,
  getAccessEvents,
  getRecentAccessEvents
};
