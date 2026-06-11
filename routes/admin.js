const express = require('express');
const User = require('../models/User');
const Application = require('../models/Application');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/admin/login', (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { error: null });
});

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUser && password === adminPass) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }

  res.render('admin/login', { error: 'Invalid admin credentials.' });
});

router.get('/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get('/admin', requireAdmin, async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  const applications = await Application.find().lean();
  const appMap = Object.fromEntries(applications.map((a) => [a.user.toString(), a]));

  const rows = users.map((user) => {
    const app = appMap[user._id.toString()];
    return {
      id: user._id.toString(),
      userId: user.userId,
      fullName: user.fullName || app?.accountLogin?.fullName || '-',
      category: user.category || app?.accountLogin?.category || '-',
      businessUnit: user.businessUnit || app?.accountLogin?.businessUnit || '-',
      status: app?.status || 'none',
      hasChanges: app?.hasChanges || false,
      updatedAt: app?.updatedAt || null,
    };
  });

  res.render('admin/users', { rows });
});

router.post('/admin/acknowledge/:userId', requireAdmin, async (req, res) => {
  await Application.findOneAndUpdate(
    { user: req.params.userId },
    { hasChanges: false }
  );
  res.redirect('/admin');
});

module.exports = router;
