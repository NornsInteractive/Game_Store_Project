const express = require('express');
const router = express.Router();
const article = require('../models/article');

router.get('/news', (req, res) => {
  const { category, search, page } = req.query;
  const result = article.findAll({
    categoryId: category || null,
    search: search || null,
    page: parseInt(page) || 1,
    limit: 9
  });
  res.render('pages/news-list', {
    layout: 'layouts/main',
    title: 'News & Articles — CyberPulse',
    articles: result.rows,
    total: result.total,
    page: result.page,
    pages: result.pages,
    currentCategory: category || null,
    currentSearch: search || ''
  });
});

router.get('/news/:slug', (req, res) => {
  const a = article.findBySlug(req.params.slug);
  if (!a) return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404, message: 'ARTICLE_NOT_FOUND: Transmission not in archive.' });
  article.incrementViews(a.id);
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const content = a.content || '';
  res.render('pages/news-detail', {
    layout: 'layouts/main',
    title: `${a.title} — CyberPulse News`,
    metaDescription: a.excerpt || (content ? content.slice(0, 160) : a.title),
    canonicalUrl: `${baseUrl}/news/${a.slug}`,
    ogType: 'article',
    ogImage: a.thumbnail && !a.thumbnail.startsWith('data:') ? `${baseUrl}${a.thumbnail}` : undefined,
    article: a
  });
});

module.exports = router;
