const { getDb } = require('../database/connection');

function findById(id) {
  const db = getDb();
  return db.prepare('SELECT id, username, email, display_name, avatar, bio, role, banned_at, created_at FROM users WHERE id = ?').get(id);
}

function findByEmail(email) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findByUsername(username) {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function create({ username, email, password, displayName }) {
  const db = getDb();
  const bcrypt = require('bcryptjs');
  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)'
  ).run(username, email, passwordHash, displayName || username);
  return findById(result.lastInsertRowid);
}

function updateProfile(id, { displayName, bio, avatar }) {
  const db = getDb();
  const sets = [];
  const vals = [];
  if (displayName !== undefined) { sets.push('display_name = ?'); vals.push(displayName); }
  if (bio !== undefined) { sets.push('bio = ?'); vals.push(bio); }
  if (avatar !== undefined) { sets.push('avatar = ?'); vals.push(avatar); }
  if (sets.length === 0) return findById(id);
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return findById(id);
}

function updateLogin(id) {
  const db = getDb();
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(id);
}

function setBanned(id, banned) {
  const db = getDb();
  if (banned) {
    db.prepare("UPDATE users SET banned_at = datetime('now') WHERE id = ?").run(id);
  } else {
    db.prepare("UPDATE users SET banned_at = NULL WHERE id = ?").run(id);
  }
}

function list({ search, page, limit } = {}) {
  const db = getDb();
  const p = page || 1;
  const l = limit || 20;
  const offset = (p - 1) * l;
  let where = '';
  const vals = [];
  if (search) { where = 'WHERE username LIKE ? OR email LIKE ?'; vals.push(`%${search}%`, `%${search}%`); }
  const rows = db.prepare(
    `SELECT id, username, email, display_name, avatar, role, banned_at, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...vals, l, offset);
  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...vals).count;
  return { rows, total, page: p, pages: Math.ceil(total / l) };
}

module.exports = { findById, findByEmail, findByUsername, create, updateProfile, updateLogin, setBanned, list };
