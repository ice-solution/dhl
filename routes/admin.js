const express = require('express');
const User = require('../models/User');
const Application = require('../models/Application');
const { requireAdmin } = require('../middleware/auth');
const { buildAdminReview, createReviewSnapshot } = require('../lib/admin-review');
const { exportToBuffer, buildExportFilename } = require('../lib/admin-export');

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

router.get('/admin/export', requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const applications = await Application.find().lean();
    const buffer = exportToBuffer(users, applications);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${buildExportFilename()}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Admin export failed:', err);
    res.status(500).send('Failed to export registration data.');
  }
});

router.get('/admin/users/:userId', requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId).lean();
  if (!user) {
    return res.redirect('/admin');
  }

  const application = await Application.findOne({ user: user._id }).lean();
  const review = buildAdminReview(user, application);

  res.render('admin/user-detail', {
    user,
    application,
    review,
    success: req.query.success || null,
  });
});

router.post('/admin/acknowledge/:userId', requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  const application = await Application.findOne({ user: req.params.userId });

  if (user && application) {
    await Application.findOneAndUpdate(
      { user: req.params.userId },
      {
        hasChanges: false,
        lastReviewedSnapshot: createReviewSnapshot(user, application),
      }
    );
    return res.redirect(`/admin/users/${req.params.userId}?success=reviewed`);
  }

  if (application) {
    await Application.findOneAndUpdate(
      { user: req.params.userId },
      { hasChanges: false }
    );
  }

  res.redirect('/admin');
});

module.exports = router;
