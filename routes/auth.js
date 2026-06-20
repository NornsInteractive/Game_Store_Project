const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const user = require('../models/user');

// Block all auth routes on serverless platforms
router.use(['/login', '/logout'], (req, res, next) => {
  if (process.env.VERCEL || process.env.CF_PAGES) {
    return res.status(404).render('pages/error', { layout: 'layouts/main', code: 404, message: 'Page not found.' });
  }
  next();
});

router.get('/login', (req, res) => {
  if (res.locals.isAdmin) return res.redirect('/admin');
  res.render('pages/login', { layout: 'layouts/auth', title: 'Admin Login — CyberPulse' });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.session.flashError = 'All fields required.';
    return res.redirect('/login');
  }
  const u = user.findByEmail(email);
  if (!u || !bcrypt.compareSync(password, u.password_hash)) {
    req.session.flashError = 'Invalid credentials.';
    return res.redirect('/login');
  }
  if (u.role !== 'admin' || u.banned_at) {
    req.session.flashError = 'Access denied.';
    return res.redirect('/login');
  }
  user.updateLogin(u.id);
  req.session.userId = u.id;
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
