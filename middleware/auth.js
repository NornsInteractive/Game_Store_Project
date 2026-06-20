const { getDb } = require('../database/connection');

function setLocals(req, res, next) {
  res.locals.currentUser = null;
  res.locals.isAdmin = false;
  res.locals.path = req.path;
  res.locals.currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.locals.disqusShortname = process.env.DISQUS_SHORTNAME || '';
  res.locals.flashSuccess = req.session.flashSuccess || null;
  res.locals.flashError = req.session.flashError || null;
  res.locals.authEnabled = !process.env.VERCEL && !process.env.CF_PAGES;
  delete req.session.flashSuccess;
  delete req.session.flashError;

  if (req.session.userId) {
    try {
      const db = getDb();
      const user = db.prepare('SELECT id, username, email, display_name, avatar, role, banned_at FROM users WHERE id = ?').get(req.session.userId);
      if (user && user.role === 'admin' && !user.banned_at) {
        res.locals.currentUser = user;
        res.locals.isAdmin = true;
      } else if (user) {
        req.session.destroy(() => {});
      }
    } catch (e) {
      // session user not found, ignore
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    req.session.flashError = 'Access denied.';
    return res.redirect('/login');
  }
  const db = getDb();
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).render('pages/error', {
        layout: 'layouts/main',
      code: 403,
      message: 'ACCESS_DENIED: Insufficient clearance level.'
    });
  }
  next();
}

module.exports = { setLocals, requireAdmin };
