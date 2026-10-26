const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Ensure database directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// In serverless environments (like Vercel), copy repository template DB to writable directory if missing
if (process.env.VERCEL && !fs.existsSync(config.dbPath)) {
  const templateDbPath = path.resolve(__dirname, '../../data/hand_hygiene.db');
  if (fs.existsSync(templateDbPath)) {
    try {
      fs.copyFileSync(templateDbPath, config.dbPath);
      console.log(`[Database] Initialized serverless DB from template at: ${templateDbPath}`);
    } catch (copyErr) {
      console.warn('[Database] Failed to copy template DB:', copyErr.message);
    }
  }
}

let db;
try {
  db = new Database(config.dbPath, {
    // verbose: config.nodeEnv === 'development' ? console.log : null
  });
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  
  // Execute schema creation
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  
  console.log(`[Database] SQLite connected successfully at: ${config.dbPath}`);
} catch (error) {
  console.error('[Database] Failed to initialize SQLite database:', error);
  throw error;
}

module.exports = db;
