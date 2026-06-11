const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/application');
  }
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await User.findOne({ userId: userId?.trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { error: 'Invalid User ID or Password.' });
    }

    req.session.userId = user._id.toString();
    req.session.displayName = user.fullName || user.userId;
    res.redirect('/application');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Login failed. Please try again.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

router.get('/account', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render('account', { user });
});

module.exports = router;
