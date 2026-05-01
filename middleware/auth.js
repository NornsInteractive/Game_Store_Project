const { getDb } = require('../database/connection');

function setLocals(req, res, next) {
  res.locals.currentUser = null;
  res.locals.isAdmin = false;
  res.locals.path = req.path;
  res.locals.flashSuccess = req.session.flashSuccess || null;
  res.locals.flashError = req.session.flashError || null;
  delete req.session.flashSuccess;
  delete req.session.flashError;

  if (req.session.userId) {
    try {
      const db = getDb();
      const user = db.prepare('SELECT id, username, email, display_name, avatar, role, banned_at FROM users WHERE id = ?').get(req.session.userId);
      if (user && !user.banned_at) {
        res.locals.currentUser = user;
        res.locals.isAdmin = user.role === 'admin';
      } else if (user && user.banned_at) {
        req.session.destroy(() => {});
      }
    } catch (e) {
      // session user not found, ignore
    }
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    req.session.flashError = 'Initialize secure session first.';
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
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

module.exports = { setLocals, requireAuth, requireAdmin };
