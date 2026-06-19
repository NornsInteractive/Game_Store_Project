const { getDb } = require('../database/connection');

function findById(id) {
  const db = getDb();
  return db.prepare('SELECT id, username, email, display_name, avatar, bio, role, banned_at, created_at FROM users WHERE id = ?').get(id);
}

function findByEmail(email) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function updateLogin(id) {
  const db = getDb();
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(id);
}

module.exports = { findById, findByEmail, updateLogin };
