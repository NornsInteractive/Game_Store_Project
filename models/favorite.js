const { getDb } = require('../database/connection');

function add(userId, gameId) {
  const db = getDb();
  try {
    db.prepare(
      'INSERT INTO user_favorites (user_id, game_id) VALUES (?, ?)'
    ).run(userId, gameId);
    return true;
  } catch (err) {
    // Duplicate entry is ok
    return false;
  }
}

function remove(userId, gameId) {
  const db = getDb();
  const result = db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND game_id = ?').run(userId, gameId);
  return result.changes > 0;
}

function isFavorite(userId, gameId) {
  const db = getDb();
  const row = db.prepare('SELECT id FROM user_favorites WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  return !!row;
}

function getUserFavorites(userId, limit = null, offset = null) {
  const db = getDb();
  let sql = `
    SELECT g.* FROM games g
    INNER JOIN user_favorites uf ON g.id = uf.game_id
    WHERE uf.user_id = ?
    ORDER BY uf.created_at DESC
  `;
  if (limit) {
    sql += ` LIMIT ${limit}`;
    if (offset) sql += ` OFFSET ${offset}`;
  }
  return db.prepare(sql).all(userId);
}

module.exports = { add, remove, isFavorite, getUserFavorites };
