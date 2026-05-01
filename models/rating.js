const { getDb } = require('../database/connection');

function set(userId, gameId, rating) {
  const db = getDb();
  db.prepare(
    'INSERT INTO ratings (user_id, game_id, rating) VALUES (?, ?, ?) ON CONFLICT(user_id, game_id) DO UPDATE SET rating = excluded.rating'
  ).run(userId, gameId, rating);
}

function getUserRating(userId, gameId) {
  const db = getDb();
  const row = db.prepare('SELECT rating FROM ratings WHERE user_id = ? AND game_id = ?').get(userId, gameId);
  return row ? row.rating : null;
}

module.exports = { set, getUserRating };
