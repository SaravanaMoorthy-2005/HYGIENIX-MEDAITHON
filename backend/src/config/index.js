require('dotenv').config();
const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbPath: path.resolve(__dirname, '../../', process.env.DB_PATH || 'data/hand_hygiene.db'),
  scanCooldownSeconds: parseFloat(process.env.SCAN_COOLDOWN_SECONDS) || 2.5
};
