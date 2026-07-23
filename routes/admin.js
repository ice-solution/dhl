const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const Application = require('../models/Application');
const { requireAdmin } = require('../middleware/auth');
const { buildAdminReview, createReviewSnapshot } = require('../lib/admin-review');
const { exportToBuffer, buildExportFilename } = require('../lib/admin-export');
const { deleteUserUploads, saveUserPhoto, MAX_BYTES } = require('../lib/upload-photos');
const {
  buildApplicationRenderContext,
  parseApplicationBody,
  mergeApplicationData,
  syncUserProfile,
} = require('../lib/application-data');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildUserSearchFilter(search) {
  const term = (search || '').trim();
  if (!term) return {};
  const regex = { $regex: escapeRegex(term), $options: 'i' };
  return {
    $or: [
      { userId: regex },
      { email: regex },
      { fullName: regex },
      { surname: regex },
      { givenName: regex },
    ],
  };
}

async function findUsersForAdminSearch(search) {
  const term = (search || '').trim();
  if (!term) {
    return User.find().sort({ createdAt: -1 }).lean();
  }

  const regex = { $regex: escapeRegex(term), $options: 'i' };
  const matchedUserIds = new Set();

  const usersByProfile = await User.find(buildUserSearchFilter(term)).select('_id').lean();
  usersByProfile.forEach((user) => matchedUserIds.add(user._id.toString()));

  const matchingApps = await Application.find({
    $or: [
      { 'profile.surname': regex },
      { 'profile.firstName': regex },
      { 'accountLogin.fullName': regex },
    ],
  }).select('user').lean();

  matchingApps.forEach((app) => matchedUserIds.add(app.user.toString()));

  if (matchedUserIds.size === 0) {
    return [];
  }

  return User.find({ _id: { $in: [...matchedUserIds] } }).sort({ createdAt: -1 }).lean();
}

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
  const search = (req.query.search || '').trim();
  const users = await findUsersForAdminSearch(search);
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

  res.render('admin/users', {
    rows,
    search,
    success: req.query.success || null,
    error: req.query.error || null,
  });
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

router.get('/admin/users/:userId/edit', requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.redirect('/admin');
  }

  const application = await Application.findOne({ user: user._id });
  res.render('application-form', buildApplicationRenderContext(user, application, {
    adminMode: true,
    adminUserId: user._id.toString(),
    success: req.query.success || null,
    error: null,
  }));
});

router.post('/admin/users/:userId/edit', requireAdmin, upload.fields([
  { name: 'uniformPhotoFile', maxCount: 1 },
  { name: 'nicePhotoFile', maxCount: 1 },
]), async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/admin');
    }

    const existing = await Application.findOne({ user: userId });
    const parsed = parseApplicationBody(req.body);
    parsed.status = existing?.status || 'draft';

    const data = mergeApplicationData(existing, parsed);

    const uniformFile = req.files?.uniformPhotoFile?.[0];
    const niceFile = req.files?.nicePhotoFile?.[0];
    if (uniformFile?.buffer?.length) {
      data.photoUpload.uniformPhoto = await saveUserPhoto(userId, 'uniform', uniformFile);
    }
    if (niceFile?.buffer?.length) {
      data.photoUpload.nicePhoto = await saveUserPhoto(userId, 'nice', niceFile);
    }

    const updatedUser = await syncUserProfile(userId, req.body);
    const snapshot = createReviewSnapshot(updatedUser, { ...data, status: parsed.status });

    await Application.findOneAndUpdate(
      { user: userId },
      {
        ...data,
        user: userId,
        hasChanges: false,
        lastReviewedSnapshot: snapshot,
      },
      { upsert: true, new: true }
    );

    res.redirect(`/admin/users/${userId}/edit?success=saved`);
  } catch (err) {
    console.error('Admin edit save failed:', err);
    const user = await User.findById(userId);
    const application = await Application.findOne({ user: userId });
    res.render('application-form', buildApplicationRenderContext(user, application, {
      adminMode: true,
      adminUserId: userId,
      error: err.message || 'Failed to save changes. Please try again.',
      success: null,
    }));
  }
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

router.post('/admin/delete/:userId', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.redirect('/admin');
    }

    const userId = user._id.toString();
    await Application.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });

    try {
      await deleteUserUploads(userId);
    } catch (uploadErr) {
      console.error('Failed to delete user uploads:', uploadErr);
    }

    res.redirect('/admin?success=deleted');
  } catch (err) {
    console.error('Admin delete user failed:', err);
    res.redirect('/admin?error=delete_failed');
  }
});

module.exports = router;
