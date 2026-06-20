const express = require('express');
const router = express.Router();
const game = require('../models/game');
const article = require('../models/article');
const { requireAdmin } = require('../middleware/auth');
const { fileToDataUrl, uploadGameCover, uploadThumbnail } = require('../middleware/upload');

// Block all admin routes on serverless platforms
router.use((req, res, next) => {
  if (process.env.VERCEL || process.env.CF_PAGES) {
    return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404, message: 'Page not found.' });
  }
  next();
});

router.get('/', requireAdmin, (req, res) => {
  const { getDb } = require('../database/connection');
  const db = getDb();
  const gameCount = db.prepare("SELECT COUNT(*) as c FROM games WHERE deleted_at IS NULL").get().c;
  const articleCount = db.prepare("SELECT COUNT(*) as c FROM articles").get().c;
  const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get().c;
  const draftCount = db.prepare("SELECT COUNT(*) as c FROM games WHERE status = 'draft' AND deleted_at IS NULL").get().c;
  res.render('pages/admin/dashboard', {
    layout: 'layouts/admin',
    title: 'Command Center — CyberPulse Admin',
    stats: { gameCount, articleCount, adminCount, draftCount },
    path: '/admin'
  });
});

router.get('/games', requireAdmin, (req, res) => {
  const { status, search, page } = req.query;
  const result = game.findAll({ status: status || null, search: search || null, page: parseInt(page) || 1, limit: 15 });
  res.render('pages/admin/games', {
    layout: 'layouts/admin',
    title: 'Manage Games — Admin',
    games: result.rows,
    total: result.total,
    page: result.page,
    pages: result.pages,
    currentStatus: status || '',
    currentSearch: search || '',
    path: '/admin/games'
  });
});

router.get('/games/create', requireAdmin, (req, res) => {
  const categories = game.getCategories('game');
  res.render('pages/admin/games-edit', {
    layout: 'layouts/admin',
    title: 'Create Game — Admin',
    gameData: null,
    categories,
    path: '/admin/games'
  });
});

router.get('/games/:id/edit', requireAdmin, (req, res) => {
  const g = game.findById(req.params.id);
  if (!g) return res.status(404).render('pages/error', { layout: 'layouts/admin', code: 404, message: 'Game not found.' });
  const categories = game.getCategories('game');
  res.render('pages/admin/games-edit', {
    layout: 'layouts/admin',
    title: `Edit: ${g.title} — Admin`,
    gameData: g,
    categories,
    path: '/admin/games'
  });
});

router.post('/games/create', requireAdmin, uploadGameCover.single('coverImage'), (req, res) => {
  const data = {
    title: req.body.title,
    description: req.body.description,
    shortDescription: req.body.shortDescription,
    developer: req.body.developer,
    publisher: req.body.publisher,
    downloadUrl: req.body.downloadUrl || '',
    releaseDate: req.body.releaseDate || '',
    categoryId: req.body.categoryId || null,
    status: req.body.status || 'draft',
    isFeatured: req.body.isFeatured === '1',
    tags: (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  };
  if (req.file) data.coverImage = fileToDataUrl(req.file);
  game.create(data);
  req.session.flashSuccess = 'Game created.';
  res.redirect('/admin/games');
});

router.post('/games/:id/edit', requireAdmin, uploadGameCover.single('coverImage'), (req, res) => {
  const data = {
    title: req.body.title,
    description: req.body.description,
    shortDescription: req.body.shortDescription,
    developer: req.body.developer,
    publisher: req.body.publisher,
    downloadUrl: req.body.downloadUrl || '',
    releaseDate: req.body.releaseDate || '',
    categoryId: req.body.categoryId || null,
    status: req.body.status || 'draft',
    isFeatured: req.body.isFeatured === '1',
    tags: (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean)
  };
  if (req.file) data.coverImage = fileToDataUrl(req.file);
  game.update(req.params.id, data);
  req.session.flashSuccess = 'Game updated.';
  res.redirect('/admin/games');
});

router.post('/games/bulk', requireAdmin, (req, res) => {
  const { ids, action } = req.body;
  if (ids && action) {
    const idList = Array.isArray(ids) ? ids : [ids];
    game.bulkAction(idList, action);
    req.session.flashSuccess = `Bulk ${action} complete.`;
  }
  res.redirect('/admin/games');
});

router.post('/games/:id/status', requireAdmin, (req, res) => {
  game.setStatus(req.params.id, req.body.status);
  res.redirect('/admin/games');
});

router.post('/games/:id/delete', requireAdmin, (req, res) => {
  game.softDelete(req.params.id);
  req.session.flashSuccess = 'Game delisted.';
  res.redirect('/admin/games');
});

router.get('/news', requireAdmin, (req, res) => {
  const { search, page } = req.query;
  const result = article.findAll({ search: search || null, page: parseInt(page) || 1, limit: 15 });
  res.render('pages/admin/news', {
    layout: 'layouts/admin',
    title: 'Manage News — Admin',
    articles: result.rows,
    total: result.total,
    page: result.page,
    pages: result.pages,
    currentSearch: search || '',
    path: '/admin/news'
  });
});

router.get('/news/create', requireAdmin, (req, res) => {
  res.render('pages/admin/news-edit', {
    layout: 'layouts/admin',
    title: 'Create Article — Admin',
    articleData: null,
    path: '/admin/news'
  });
});

router.get('/news/:id/edit', requireAdmin, (req, res) => {
  const a = article.findById(req.params.id);
  if (!a) return res.status(404).render('pages/error', { layout: 'layouts/admin', code: 404 });
  res.render('pages/admin/news-edit', {
    layout: 'layouts/admin',
    title: `Edit: ${a.title} — Admin`,
    articleData: a,
    path: '/admin/news'
  });
});

router.post('/news/create', requireAdmin, uploadThumbnail.single('thumbnail'), (req, res) => {
  if (!req.session.userId) {
    req.session.flashError = 'Please log in again.';
    return res.redirect('/login');
  }

  const data = {
    title: req.body.title,
    excerpt: req.body.excerpt,
    content: req.body.content,
    categoryId: req.body.categoryId || null,
    isFeatured: req.body.isFeatured === '1',
    status: req.body.status || 'draft',
    authorId: req.session.userId
  };
  if (req.file) data.thumbnail = fileToDataUrl(req.file);
  article.create(data);
  req.session.flashSuccess = 'Article created.';
  res.redirect('/admin/news');
});

router.post('/news/:id/edit', requireAdmin, uploadThumbnail.single('thumbnail'), (req, res) => {
  const data = {
    title: req.body.title,
    excerpt: req.body.excerpt,
    content: req.body.content,
    categoryId: req.body.categoryId || null,
    isFeatured: req.body.isFeatured === '1',
    status: req.body.status || 'draft'
  };
  if (req.file) data.thumbnail = fileToDataUrl(req.file);
  article.update(req.params.id, data);
  req.session.flashSuccess = 'Article updated.';
  res.redirect('/admin/news');
});

router.post('/news/:id/delete', requireAdmin, (req, res) => {
  article.remove(req.params.id);
  req.session.flashSuccess = 'Article deleted.';
  res.redirect('/admin/news');
});

module.exports = router;
