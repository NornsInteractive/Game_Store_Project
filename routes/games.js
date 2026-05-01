const express = require('express');
const router = express.Router();
const game = require('../models/game');
const comment = require('../models/comment');
const rating = require('../models/rating');
const activity = require('../models/activity');
const { requireAuth } = require('../middleware/auth');

router.get('/games', (req, res) => {
  const { category, search, order, page } = req.query;
  const result = game.findAll({
    categoryId: category || null,
    search: search || null,
    orderBy: order || null,
    page: parseInt(page) || 1,
    limit: 12,
    status: 'published'
  });
  const categories = game.getCategoryCounts('game');
  res.render('pages/games-list', {
    layout: 'layouts/main',
    title: 'Games Library — CyberPulse',
    games: result.rows,
    total: result.total,
    page: result.page,
    pages: result.pages,
    categories,
    currentCategory: category || null,
    currentSearch: search || '',
    currentOrder: order || null
  });
});

router.get('/games/:slug', (req, res) => {
  const g = game.findBySlug(req.params.slug);
  if (!g) return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404, message: 'GAME_NOT_FOUND: That title isn\'t in our registry.' });
  game.incrementViews(g.id);
  const comments = comment.getByGameId(g.id);
  let userRating = null;
  let userVotes = {};
  if (req.session.userId) {
    userRating = rating.getUserRating(req.session.userId, g.id);
    const commentIds = [];
    const collectIds = (list) => { list.forEach(c => { commentIds.push(c.id); if (c.replies) collectIds(c.replies); }); };
    collectIds(comments);
    userVotes = comment.getUserVotes(req.session.userId, commentIds);
  }
  res.render('pages/game-detail', {
    layout: 'layouts/main',
    title: `${g.title} — CyberPulse`,
    game: g,
    comments,
    userRating,
    userVotes,
    parsedScreenshots: JSON.parse(g.screenshots || '[]'),
    parsedSysReq: JSON.parse(g.system_requirements || '{}'),
    parsedTags: JSON.parse(g.tags || '[]')
  });
});

router.post('/games/:slug/comment', requireAuth, (req, res) => {
  const g = game.findBySlug(req.params.slug);
  if (!g) return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404 });
  const { content, parentId } = req.body;
  if (!content || !content.trim()) {
    req.session.flashError = 'Comment cannot be empty.';
    return res.redirect(`/games/${req.params.slug}`);
  }
  comment.create({ userId: req.session.userId, gameId: g.id, parentId: parentId || null, content: content.trim() });
  activity.log(req.session.userId, 'comment_game', 'game', g.id, { comment: content.trim().substring(0, 100) });
  req.session.flashSuccess = 'Comment posted.';
  res.redirect(`/games/${req.params.slug}`);
});

router.post('/games/:slug/rate', requireAuth, (req, res) => {
  const g = game.findBySlug(req.params.slug);
  if (!g) return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404 });
  const val = parseInt(req.body.rating);
  if (!val || val < 1 || val > 5) {
    req.session.flashError = 'Rating must be 1-5.';
    return res.redirect(`/games/${req.params.slug}`);
  }
  rating.set(req.session.userId, g.id, val);
  game.updateRating(g.id);
  activity.log(req.session.userId, 'rate_game', 'game', g.id, { rating: val });
  req.session.flashSuccess = 'Rating submitted.';
  res.redirect(`/games/${req.params.slug}`);
});

module.exports = router;
