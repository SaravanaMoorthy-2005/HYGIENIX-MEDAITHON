const express = require('express');
const router = express.Router();

const { handleRfidScan } = require('../controllers/rfidController');
const { getAllStaff, createStaff, updateStaffStatus } = require('../controllers/staffController');
const { getAllBedZones, createBedZone } = require('../controllers/bedController');
const { getAllDevices, handleHeartbeat } = require('../controllers/deviceController');
const {
  getDashboardSummary,
  getAccessEvents,
  getRecentAccessEvents
} = require('../controllers/dashboardController');
const seedDatabase = require('../database/seed');

// RFID Scan Endpoint (ESP32 Integration)
router.post('/rfid/scan', handleRfidScan);

// Access Events
router.get('/access-events', getAccessEvents);
router.get('/access-events/recent', getRecentAccessEvents);

// Staff Management
router.get('/staff', getAllStaff);
router.post('/staff', createStaff);
router.patch('/staff/:id/status', updateStaffStatus);

// Bed Zones Management
router.get('/bed-zones', getAllBedZones);
router.post('/bed-zones', createBedZone);

// Device Management & Health
router.get('/devices', getAllDevices);
router.post('/device/heartbeat', handleHeartbeat);

// Dashboard Summary & Analytics
router.get('/dashboard/summary', getDashboardSummary);

// Demo Utility: Re-seed database
router.post('/reset-demo', (req, res) => {
  try {
    seedDatabase(true);
    return res.json({ success: true, message: 'Database reset to demo state successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset demo database' });
  }
});

module.exports = router;
