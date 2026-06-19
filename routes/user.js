const express = require('express');
const router = express.Router();
const user = require('../models/user');
const game = require('../models/game');
const activity = require('../models/activity');
const { requireAuth } = require('../middleware/auth');
const { fileToDataUrl, uploadAvatar } = require('../middleware/upload');

router.get('/', requireAuth, (req, res) => {
  const recentActivity = activity.getUserActivity(req.session.userId, 20);
  res.render('pages/user-dashboard', {
    layout: 'layouts/user',
    title: 'Dashboard — CyberPulse',
    recentActivity,
    path: '/dashboard'
  });
});

router.get('/library', requireAuth, (req, res) => {
  const { getDb } = require('../database/connection');
  const db = getDb();
  const library = db.prepare(
    `SELECT g.*, ul.purchased_at FROM user_library ul
     JOIN games g ON ul.game_id = g.id
     WHERE ul.user_id = ? ORDER BY ul.purchased_at DESC`
  ).all(req.session.userId);
  res.render('pages/user-library', {
    layout: 'layouts/user',
    title: 'My Library — CyberPulse',
    library,
    path: '/dashboard/library'
  });
});

router.get('/profile', requireAuth, (req, res) => {
  const u = user.findById(req.session.userId);
  res.render('pages/user-profile', {
    layout: 'layouts/user',
    title: 'Profile — CyberPulse',
    profile: u,
    path: '/dashboard/profile'
  });
});

router.post('/profile', requireAuth, uploadAvatar.single('avatar'), (req, res) => {
  const data = { displayName: req.body.displayName, bio: req.body.bio };
  if (req.file) data.avatar = fileToDataUrl(req.file);
  user.updateProfile(req.session.userId, data);
  req.session.flashSuccess = 'Profile updated.';
  res.redirect('/dashboard/profile');
});

router.get('/submit', requireAuth, (req, res) => {
  const categories = game.getCategories('game');
  res.render('pages/submit-game', {
    layout: 'layouts/user',
    title: 'Submit Game — CyberPulse',
    categories,
    path: '/dashboard/submit'
  });
});

router.post('/submit', requireAuth, (req, res) => {
  const data = {
    title: req.body.title,
    description: req.body.description,
    shortDescription: req.body.shortDescription,
    developer: req.body.developer,
    publisher: req.body.publisher,
    downloadUrl: req.body.downloadUrl || '',
    releaseDate: req.body.releaseDate || '',
    categoryId: req.body.categoryId || null,
    tags: (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    status: 'draft',
    authorId: req.session.userId
  };
  if (!data.title || !data.description) {
    req.session.flashError = 'Title and description are required.';
    return res.redirect('/dashboard/submit');
  }
  game.create(data);
  activity.log(req.session.userId, 'submit_game', 'game', null, { title: data.title });
  req.session.flashSuccess = 'Game submitted for review.';
  res.redirect('/dashboard');
});

module.exports = router;
