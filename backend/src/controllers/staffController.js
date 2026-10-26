const db = require('../database/db');
const { broadcastEvent } = require('../sockets/socketHandler');

function getAllStaff(req, res) {
  try {
    const { status, role } = req.query;
    let query = 'SELECT * FROM staff WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';
    const staffList = db.prepare(query).all(...params);
    return res.json({ success: true, count: staffList.length, data: staffList });
  } catch (error) {
    console.error('[Staff Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff members' });
  }
}

function createStaff(req, res) {
  try {
    let { staff_id, name, role, badge_uid, status = 'ACTIVE' } = req.body;

    if (!staff_id || !name || !role || !badge_uid) {
      return res.status(400).json({
        success: false,
        message: 'staff_id, name, role, and badge_uid are required'
      });
    }

    staff_id = String(staff_id).trim();
    name = String(name).trim();
    role = String(role).trim();
    badge_uid = String(badge_uid).trim().toUpperCase();
    status = String(status).trim().toUpperCase();

    const validRoles = ['Doctor', 'Nurse', 'Supervisor', 'Other'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    const validStatuses = ['ACTIVE', 'REVOKED', 'INACTIVE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check duplicate badge_uid
    const existingBadge = db.prepare('SELECT * FROM staff WHERE badge_uid = ?').get(badge_uid);
    if (existingBadge) {
      return res.status(409).json({
        success: false,
        message: `RFID UID ${badge_uid} is already assigned to staff ${existingBadge.staff_id} (${existingBadge.name})`
      });
    }

    // Check duplicate staff_id
    const existingId = db.prepare('SELECT * FROM staff WHERE staff_id = ?').get(staff_id);
    if (existingId) {
      return res.status(409).json({
        success: false,
        message: `Staff ID ${staff_id} already exists`
      });
    }

    const insert = db.prepare(`
      INSERT INTO staff (staff_id, name, role, badge_uid, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    insert.run(staff_id, name, role, badge_uid, status);

    const createdStaff = db.prepare('SELECT * FROM staff WHERE staff_id = ?').get(staff_id);
    broadcastEvent('staff_created', createdStaff);

    return res.status(201).json({
      success: true,
      message: 'Staff member registered successfully',
      data: createdStaff
    });
  } catch (error) {
    console.error('[Create Staff Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create staff member' });
  }
}

function updateStaffStatus(req, res) {
  try {
    const { id } = req.params;
    let { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    status = String(status).trim().toUpperCase();
    const validStatuses = ['ACTIVE', 'REVOKED', 'INACTIVE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const staff = db.prepare('SELECT * FROM staff WHERE staff_id = ?').get(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: `Staff member ${id} not found` });
    }

    db.prepare(`
      UPDATE staff
      SET status = ?, updated_at = datetime('now')
      WHERE staff_id = ?
    `).run(status, id);

    const updatedStaff = db.prepare('SELECT * FROM staff WHERE staff_id = ?').get(id);
    broadcastEvent('staff_updated', updatedStaff);

    return res.json({
      success: true,
      message: `Staff status updated to ${status}`,
      data: updatedStaff
    });
  } catch (error) {
    console.error('[Update Staff Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update staff status' });
  }
}

module.exports = {
  getAllStaff,
  createStaff,
  updateStaffStatus
};
