const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const os = require('os');

const defaultDbPath = process.env.VERCEL || process.env.CF_PAGES
  ? path.join(os.tmpdir(), 'cyberpulse-store.db')
  : path.join(__dirname, 'store.db');
const DB_PATH = process.env.DATABASE_PATH || defaultDbPath;

let db = null;
let initPromise = null;

// Buffer to hold the database file in memory for saving
function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, buffer);
}

function getDb() {
  if (db) return db;
  throw new Error('Database not initialized. Call initDb() first.');
}

async function initDb() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const SQL = await initSqlJs();
    // Load existing DB or create new one
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
    // Enable WAL-like behavior: save on every write via a simple wrapper
    db.run('PRAGMA foreign_keys = ON');
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.run(schema);
    saveDb();
    return db;
  })();
  return initPromise;
}

// Wrapper to auto-save after writes
function run(sql, params = []) {
  const d = getDb();
  d.run(sql, params);
  saveDb();
}

// For queries - wraps sql.js to provide a better-sqlite3-like API
// sql.js doesn't have prepare().all(), so we wrap it

class Statement {
  constructor(d, sql) {
    this.d = d;
    this.sql = sql;
  }

  run(...params) {
    const flatParams = params.length ? (Array.isArray(params[0]) ? params[0] : params) : [];
    this.d.run(this.sql, flatParams);
    saveDb();
    const stmt = this.d.prepare('SELECT last_insert_rowid() as id');
    let row = { id: 0 };
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return { lastInsertRowid: row.id, changes: this.d.getRowsModified() };
  }

  get(...params) {
    const flatParams = params.length ? (Array.isArray(params[0]) ? params[0] : params) : [];
    const stmt = this.d.prepare(this.sql);
    stmt.bind(flatParams);
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
      // sql.js returns '' for NULL in getAsObject, convert to null
      for (const key of Object.keys(row)) {
        if (row[key] === '') row[key] = null;
      }
    }
    stmt.free();
    return row;
  }

  all(...params) {
    const flatParams = params.length ? (Array.isArray(params[0]) ? params[0] : params) : [];
    const stmt = this.d.prepare(this.sql);
    stmt.bind(flatParams);
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      for (const key of Object.keys(row)) {
        if (row[key] === '') row[key] = null;
      }
      rows.push(row);
    }
    stmt.free();
    return rows;
  }
}

// Patch the db object to provide a better-sqlite3-like API
function wrapDb(d) {
  return {
    prepare: (sql) => new Statement(d, sql),
    exec: (sql) => { d.run(sql); saveDb(); },
    run: (sql, ...params) => {
      d.run(sql, params.flat());
      saveDb();
    }
  };
}

// The actual public API
function getWrappedDb() {
  return wrapDb(getDb());
}

function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
    initPromise = null;
  }
}

module.exports = { initDb, getDb: getWrappedDb, closeDb };
