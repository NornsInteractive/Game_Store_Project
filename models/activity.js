const { getDb } = require('../database/connection');

function log(userId, action, targetType, targetId, metadata) {
  const db = getDb();
  db.prepare(
    'INSERT INTO activity_log (user_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?)'
  ).run(userId ?? null, action, targetType || null, targetId || null, JSON.stringify(metadata || {}));
}

function getUserActivity(userId, limit = 20) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, limit);
}

function getRecentActivity(limit = 30) {
  const db = getDb();
  return db.prepare(
    `SELECT al.*, u.username, u.avatar FROM activity_log al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC LIMIT ?`
  ).all(limit);
}

module.exports = { log, getUserActivity, getRecentActivity };
