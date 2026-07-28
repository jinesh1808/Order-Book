import Database from 'better-sqlite3';
import path from 'path';

// Define the database path
const dbPath = path.resolve(__dirname, '../../data.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable WAL mode for better performance with concurrent reads/writes
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    side TEXT NOT NULL,
    price REAL NOT NULL,
    size REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maker_order_id TEXT NOT NULL,
    taker_order_id TEXT NOT NULL,
    price REAL NOT NULL,
    size REAL NOT NULL,
    timestamp INTEGER NOT NULL
  );
`);

export default db;
