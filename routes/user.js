const express = require('express');
const router = express.Router();
const user = require('../models/user');
const game = require('../models/game');
const favorite = require('../models/favorite');
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
  const tab = req.query.tab || 'library';
  
  let library = [];
  let favorites = [];
  
  if (tab === 'library' || !tab) {
    library = db.prepare(
      `SELECT g.*, ul.purchased_at FROM user_library ul
       JOIN games g ON ul.game_id = g.id
       WHERE ul.user_id = ? ORDER BY ul.purchased_at DESC`
    ).all(req.session.userId);
  }
  
  if (tab === 'favorites' || !tab) {
    favorites = favorite.getUserFavorites(req.session.userId);
  }
  
  res.render('pages/user-library', {
    layout: 'layouts/user',
    title: 'My Library — CyberPulse',
    library,
    favorites,
    currentTab: tab,
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

module.exports = router;
