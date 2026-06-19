const express = require('express');
const router = express.Router();
const game = require('../models/game');

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
  res.render('pages/game-detail', {
    layout: 'layouts/main',
    title: `${g.title} — CyberPulse`,
    game: g,
    parsedScreenshots: JSON.parse(g.screenshots || '[]'),
    parsedSysReq: JSON.parse(g.system_requirements || '{}'),
    parsedTags: JSON.parse(g.tags || '[]')
  });
});

module.exports = router;
