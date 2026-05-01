const session = require('express-session');
const { getDb } = require('./connection');

class SqliteSessionStore extends session.Store {
  constructor(options) {
    super();
    this.db = options.db;
    const stmts = [
      `CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, expires TEXT, sess TEXT)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires)`
    ];
    stmts.forEach(s => this.db.exec(s));
  }

  get(sid, callback) {
    try {
      const row = this.db.prepare("SELECT sess FROM sessions WHERE sid = ? AND expires > datetime('now')").get(sid);
      callback(null, row ? JSON.parse(row.sess) : null);
    } catch (err) { callback(err); }
  }

  set(sid, session, callback) {
    try {
      const maxAge = session.cookie?.maxAge || 86400000;
      const expires = new Date(Date.now() + maxAge).toISOString().replace('T', ' ').slice(0, 19);
      this.db.prepare('INSERT OR REPLACE INTO sessions (sid, expires, sess) VALUES (?, ?, ?)').run(sid, expires, JSON.stringify(session));
      callback(null);
    } catch (err) { callback(err); }
  }

  destroy(sid, callback) {
    try { this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid); callback(null); } catch (err) { callback(err); }
  }

  touch(sid, session, callback) {
    try {
      const maxAge = session.cookie?.maxAge || 86400000;
      const expires = new Date(Date.now() + maxAge).toISOString().replace('T', ' ').slice(0, 19);
      this.db.prepare('UPDATE sessions SET expires = ? WHERE sid = ?').run(expires, sid);
      callback(null);
    } catch (err) { callback(err); }
  }
}

module.exports = SqliteSessionStore;