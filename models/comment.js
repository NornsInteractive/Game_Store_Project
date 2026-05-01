const { getDb } = require('../database/connection');

function getByGameId(gameId) {
  const db = getDb();
  const topLevel = db.prepare(
    `SELECT c.*, u.username, u.avatar, u.role
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.game_id = ? AND c.parent_id IS NULL AND c.is_hidden = 0
     ORDER BY c.upvotes DESC, c.created_at DESC`
  ).all(gameId);
  return topLevel.map(c => loadReplies(c));
}

function getByArticleId(articleId) {
  const db = getDb();
  const topLevel = db.prepare(
    `SELECT c.*, u.username, u.avatar, u.role
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.article_id = ? AND c.parent_id IS NULL AND c.is_hidden = 0
     ORDER BY c.upvotes DESC, c.created_at DESC`
  ).all(articleId);
  return topLevel.map(c => loadReplies(c));
}

function loadReplies(comment) {
  const db = getDb();
  const replies = db.prepare(
    `SELECT c.*, u.username, u.avatar, u.role
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.parent_id = ? AND c.is_hidden = 0
     ORDER BY c.upvotes DESC, c.created_at ASC`
  ).all(comment.id);
  comment.replies = replies.map(r => loadReplies(r));
  return comment;
}

function getFlagged({ page, limit } = {}) {
  const db = getDb();
  const p = page || 1;
  const l = limit || 20;
  const offset = (p - 1) * l;
  const rows = db.prepare(
    `SELECT c.*, u.username, u.avatar,
     COALESCE(g.title, a.title) as target_title,
     CASE WHEN c.game_id IS NOT NULL THEN 'game' ELSE 'article' END as target_type,
     CASE WHEN c.game_id IS NOT NULL THEN g.slug ELSE a.slug END as target_slug
     FROM comments c JOIN users u ON c.user_id = u.id
     LEFT JOIN games g ON c.game_id = g.id
     LEFT JOIN articles a ON c.article_id = a.id
     WHERE c.is_flagged = 1
     ORDER BY CASE c.flag_severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, c.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(l, offset);
  const total = db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_flagged = 1').get().count;
  return { rows, total, page: p, pages: Math.ceil(total / l) };
}

function getFlaggedCount() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) as count FROM comments WHERE is_flagged = 1').get().count;
}

function create({ userId, gameId, articleId, parentId, content }) {
  const db = getDb();
  db.prepare(
    'INSERT INTO comments (user_id, game_id, article_id, parent_id, content) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, gameId || null, articleId || null, parentId || null, content);
}

function vote(commentId, userId, voteDir) {
  const db = getDb();
  const existing = db.prepare('SELECT vote FROM comment_votes WHERE user_id = ? AND comment_id = ?').get(userId, commentId);
  if (existing) {
    if (existing.vote === voteDir) {
      db.prepare('DELETE FROM comment_votes WHERE user_id = ? AND comment_id = ?').run(userId, commentId);
      const delta = voteDir === 1 ? -1 : 1;
      db.prepare(`UPDATE comments SET ${voteDir === 1 ? 'upvotes' : 'downvotes'} = MAX(0, ${voteDir === 1 ? 'upvotes' : 'downvotes'} + ?) WHERE id = ?`).run(delta, commentId);
      return { action: 'removed' };
    } else {
      db.prepare('UPDATE comment_votes SET vote = ? WHERE user_id = ? AND comment_id = ?').run(voteDir, userId, commentId);
      db.prepare(`UPDATE comments SET upvotes = upvotes + ?, downvotes = downvotes + ? WHERE id = ?`).run(voteDir === 1 ? 1 : -1, voteDir === -1 ? 1 : -1, commentId);
      return { action: 'changed' };
    }
  } else {
    db.prepare('INSERT INTO comment_votes (user_id, comment_id, vote) VALUES (?, ?, ?)').run(userId, commentId, voteDir);
    db.prepare(`UPDATE comments SET ${voteDir === 1 ? 'upvotes' : 'downvotes'} = ${voteDir === 1 ? 'upvotes' : 'downvotes'} + 1 WHERE id = ?`).run(commentId);
    return { action: 'added' };
  }
}

function flag(commentId, reason, severity) {
  const db = getDb();
  db.prepare('UPDATE comments SET is_flagged = 1, flag_reason = ?, flag_severity = ? WHERE id = ?').run(reason || '', severity || 'low', commentId);
}

function hide(commentId) {
  const db = getDb();
  db.prepare('UPDATE comments SET is_hidden = 1, is_flagged = 0 WHERE id = ?').run(commentId);
}

function unflag(commentId) {
  const db = getDb();
  db.prepare('UPDATE comments SET is_flagged = 0, flag_reason = NULL, flag_severity = NULL WHERE id = ?').run(commentId);
}

function remove(commentId) {
  const db = getDb();
  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
}

function getUserVotes(userId, commentIds) {
  if (!userId || !commentIds.length) return {};
  const db = getDb();
  const placeholders = commentIds.map(() => '?').join(',');
  const rows = db.prepare(`SELECT comment_id, vote FROM comment_votes WHERE user_id = ? AND comment_id IN (${placeholders})`).all(userId, ...commentIds);
  const map = {};
  rows.forEach(r => { map[r.comment_id] = r.vote; });
  return map;
}

module.exports = { getByGameId, getByArticleId, getFlagged, getFlaggedCount, create, vote, flag, hide, unflag, remove, getUserVotes };
