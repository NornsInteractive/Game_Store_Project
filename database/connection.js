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

function columnExists(table, column) {
  const stmt = db.prepare(`PRAGMA table_info(${table})`);
  let exists = false;
  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (row.name === column) exists = true;
  }
  stmt.free();
  return exists;
}

function migrateGamesTable() {
  const tableStmt = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'games'");
  const hasGames = tableStmt.step();
  tableStmt.free();
  if (!hasGames) return;

  if (!columnExists('games', 'download_url')) {
    db.run("ALTER TABLE games ADD COLUMN download_url TEXT DEFAULT ''");
  }

  if (columnExists('games', 'price') || columnExists('games', 'discount_price')) {
    db.run('PRAGMA foreign_keys = OFF');
    db.run(`
      CREATE TABLE IF NOT EXISTS games_new (
        id                INTEGER PRIMARY KEY,
        title             TEXT    NOT NULL,
        slug              TEXT    NOT NULL UNIQUE,
        description       TEXT    NOT NULL DEFAULT '',
        short_description TEXT,
        developer         TEXT    DEFAULT '',
        publisher         TEXT    DEFAULT '',
        download_url      TEXT    DEFAULT '',
        release_date      TEXT,
        category_id       INTEGER,
        cover_image       TEXT    DEFAULT '/uploads/covers/default.png',
        hero_image        TEXT,
        screenshots       TEXT    DEFAULT '[]',
        system_requirements TEXT  DEFAULT '{}',
        tags              TEXT    DEFAULT '[]',
        status            TEXT    NOT NULL DEFAULT 'draft',
        rating_avg        REAL    DEFAULT 0.0,
        rating_count      INTEGER DEFAULT 0,
        views_count       INTEGER DEFAULT 0,
        is_featured       INTEGER DEFAULT 0,
        created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
        deleted_at        TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);
    db.run(`
      INSERT INTO games_new (
        id, title, slug, description, short_description, developer, publisher, download_url,
        release_date, category_id, cover_image, hero_image, screenshots, system_requirements,
        tags, status, rating_avg, rating_count, views_count, is_featured, created_at, updated_at, deleted_at
      )
      SELECT
        id, title, slug, description, short_description, developer, publisher, COALESCE(download_url, ''),
        release_date, category_id, cover_image, hero_image, screenshots, system_requirements,
        tags, status, rating_avg, rating_count, views_count, is_featured, created_at, updated_at, deleted_at
      FROM games
    `);
    db.run('DROP TABLE games');
    db.run('ALTER TABLE games_new RENAME TO games');
    db.run('CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)');
    db.run('CREATE INDEX IF NOT EXISTS idx_games_featured ON games(is_featured)');
    db.run('CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug)');
    db.run('CREATE INDEX IF NOT EXISTS idx_games_category ON games(category_id)');
    db.run('PRAGMA foreign_keys = ON');
  }
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
    migrateGamesTable();
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
