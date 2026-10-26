require('dotenv').config();
const path = require('path');

const isVercel = Boolean(process.env.VERCEL);

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dbPath: process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : (isVercel ? path.join('/tmp', 'hand_hygiene.db') : path.resolve(__dirname, '../../data/hand_hygiene.db')),
  scanCooldownSeconds: parseFloat(process.env.SCAN_COOLDOWN_SECONDS) || 2.5
};
