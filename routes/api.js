const express = require('express');
const router = express.Router();
const comment = require('../models/comment');
const { requireAuth } = require('../middleware/auth');

router.post('/comments/:id/vote', requireAuth, (req, res) => {
  const { vote } = req.body;
  if (![1, -1].includes(parseInt(vote))) {
    return res.status(400).json({ error: 'Invalid vote value' });
  }
  const result = comment.vote(parseInt(req.params.id), req.session.userId, parseInt(vote));
  res.json(result);
});

router.post('/comments/:id/flag', requireAuth, (req, res) => {
  const { reason } = req.body;
  comment.flag(parseInt(req.params.id), reason || '', 'medium');
  res.json({ success: true });
});

module.exports = router;
