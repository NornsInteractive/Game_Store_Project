const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const user = require('../models/user');

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('pages/login', { layout: 'layouts/auth', title: 'Login — CyberPulse' });
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
  if (u.banned_at) {
    req.session.flashError = 'Account suspended.';
    return res.redirect('/login');
  }
  user.updateLogin(u.id);
  req.session.userId = u.id;
  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('pages/register', { layout: 'layouts/auth', title: 'Register — CyberPulse' });
});

router.post('/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  if (!username || !email || !password || !confirmPassword) {
    req.session.flashError = 'All fields required.';
    return res.redirect('/register');
  }
  if (password !== confirmPassword) {
    req.session.flashError = 'Passwords do not match.';
    return res.redirect('/register');
  }
  if (password.length < 6) {
    req.session.flashError = 'Password must be at least 6 characters.';
    return res.redirect('/register');
  }
  if (user.findByEmail(email)) {
    req.session.flashError = 'Email already registered.';
    return res.redirect('/register');
  }
  if (user.findByUsername(username)) {
    req.session.flashError = 'Username taken.';
    return res.redirect('/register');
  }
  const newUser = user.create({ username, email, password });
  req.session.userId = newUser.id;
  req.session.flashSuccess = 'Welcome to CyberPulse, runner.';
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
