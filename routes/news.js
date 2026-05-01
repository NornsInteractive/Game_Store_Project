const express = require('express');
const router = express.Router();
const article = require('../models/article');
const comment = require('../models/comment');
const activity = require('../models/activity');
const { requireAuth } = require('../middleware/auth');

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
  const comments = comment.getByArticleId(a.id);
  let userVotes = {};
  if (req.session.userId) {
    const commentIds = [];
    const collectIds = (list) => { list.forEach(c => { commentIds.push(c.id); if (c.replies) collectIds(c.replies); }); };
    collectIds(comments);
    userVotes = comment.getUserVotes(req.session.userId, commentIds);
  }
  res.render('pages/news-detail', {
    layout: 'layouts/main',
    title: `${a.title} — CyberPulse News`,
    article: a,
    comments,
    userVotes
  });
});

router.post('/news/:slug/comment', requireAuth, (req, res) => {
  const a = article.findBySlug(req.params.slug);
  if (!a) return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404 });
  const { content, parentId } = req.body;
  if (!content || !content.trim()) {
    req.session.flashError = 'Comment cannot be empty.';
    return res.redirect(`/news/${req.params.slug}`);
  }
  comment.create({ userId: req.session.userId, articleId: a.id, parentId: parentId || null, content: content.trim() });
  activity.log(req.session.userId, 'comment_article', 'article', a.id, { comment: content.trim().substring(0, 100) });
  req.session.flashSuccess = 'Comment posted.';
  res.redirect(`/news/${req.params.slug}`);
});

module.exports = router;
