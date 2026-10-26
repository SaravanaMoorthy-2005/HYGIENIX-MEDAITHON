const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const db = require('./database/db');
const seedDatabase = require('./database/seed');
const { initSockets } = require('./sockets/socketHandler');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSockets(server, config.corsOrigin);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Ensure database has initial seed data if empty
try {
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get().count;
  if (staffCount === 0) {
    console.log('[Bootstrap] No existing staff found, seeding demo database...');
    seedDatabase(false);
  }
} catch (e) {
  console.warn('[Bootstrap] Check seed warning:', e.message);
}

// Healthcheck (available at /health locally and /api/health through Vercel rewrites)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Smart Hand-Hygiene Monitoring System - Module 1',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

if (require.main === module) {
  server.listen(config.port, config.host, () => {
    console.log(`=======================================================`);
    console.log(` SMART HAND-HYGIENE MONITORING SYSTEM - MODULE 1`);
    console.log(` Staff Identification & Bed-Zone Access Backend`);
    console.log(` Server running on http://${config.host}:${config.port}`);
    console.log(` Socket.IO enabled for real-time dashboard events`);
    console.log(` Database: SQLite (${config.dbPath})`);
    console.log(`=======================================================`);
  });
}

// Export Express app instance directly for Vercel, attaching app and server properties for backward compatibility
app.app = app;
app.server = server;
module.exports = app;
