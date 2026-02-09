import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '../../data');

export function getDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const dbPath = path.join(DATA_DIR, 'fulfillment.db');
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS boxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      length REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      weight_limit REAL NOT NULL DEFAULT 0,
      cost REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_ref TEXT,
      box_id TEXT NOT NULL,
      total_volume REAL NOT NULL,
      box_volume REAL NOT NULL,
      utilization REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'recommended',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (box_id) REFERENCES boxes(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      name TEXT NOT NULL,
      length REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      weight REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_box_id ON orders(box_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  `);
}
