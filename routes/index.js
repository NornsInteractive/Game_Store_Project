const express = require('express');
const router = express.Router();
const game = require('../models/game');
const article = require('../models/article');

router.get('/', (req, res) => {
  const featuredGames = game.getFeatured(6);
  const trendingGames = game.getTrending(5);
  const featuredArticles = article.getFeatured(3);
  const categories = game.getCategoryCounts('game');
  res.render('pages/home', {
    layout: 'layouts/main',
    title: 'CyberPulse Gaming',
    featuredGames,
    trendingGames,
    featuredArticles,
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

router.get('/robots.txt', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /logout

Sitemap: ${baseUrl}/sitemap.xml`
  );
});

router.get('/sitemap.xml', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const games = game.findAll({ status: 'published', limit: 1000 });
  const articles = article.findAll({ limit: 1000 });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/games</loc><priority>0.9</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/news</loc><priority>0.8</priority></url>\n`;
  games.rows.forEach(g => {
    xml += `  <url><loc>${baseUrl}/games/${g.slug}</loc><lastmod>${g.updated_at || g.created_at}</lastmod><priority>0.7</priority></url>\n`;
  });
  articles.rows.forEach(a => {
    xml += `  <url><loc>${baseUrl}/news/${a.slug}</loc><lastmod>${a.updated_at || a.created_at}</lastmod><priority>0.6</priority></url>\n`;
  });
  xml += '</urlset>';

  res.type('application/xml').send(xml);
});

module.exports = router;
