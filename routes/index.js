const express = require('express');
const router = express.Router();
const game = require('../models/game');
const article = require('../models/article');
const activity = require('../models/activity');

router.get('/', (req, res) => {
  const featuredGames = game.getFeatured(6);
  const trendingGames = game.getTrending(5);
  const featuredArticles = article.getFeatured(3);
  const recentActivity = activity.getRecentActivity(10);
  const categories = game.getCategoryCounts('game');
  res.render('pages/home', {
    layout: 'layouts/main',
    title: 'CyberPulse Gaming — Deep Sea Noir',
    featuredGames,
    trendingGames,
    featuredArticles,
    recentActivity,
    categories
  });
});

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const page = parseInt(req.query.page) || 1;
  let gameResults = { rows: [], total: 0, pages: 0 };
  let articleResults = { rows: [], total: 0, pages: 0 };
  if (q) {
    gameResults = game.findAll({ search: q, page, limit: 6, status: 'published' });
    articleResults = article.findAll({ search: q, page, limit: 6 });
  }
  res.render('pages/search', {
    layout: 'layouts/main',
    title: `Search: ${q}`,
    query: q,
    gameResults,
    articleResults,
    page
  });
});

module.exports = router;
