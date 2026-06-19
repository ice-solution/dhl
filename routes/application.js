const express = require('express');
const multer = require('multer');
const Application = require('../models/Application');
const User = require('../models/User');
const { requireAuth, clearUserSession } = require('../middleware/auth');
const { sendApplicationSaveEmail } = require('../lib/registration-emails');
const {
  buildApplicationRenderContext,
  parseApplicationBody,
  mergeApplicationData,
  syncUserProfile,
} = require('../lib/application-data');
const { saveUserPhoto } = require('../lib/upload-photos');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/application', requireAuth, async (req, res) => {
  const application = await Application.findOne({ user: req.user._id });
  res.render('application-form', buildApplicationRenderContext(req.user, application, {
    success: req.query.success || null,
  }));
});

router.post('/application', requireAuth, upload.fields([
  { name: 'uniformPhotoFile', maxCount: 1 },
  { name: 'nicePhotoFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const existing = await Application.findOne({ user: req.session.userId });
    const parsed = parseApplicationBody(req.body);
    const data = mergeApplicationData(existing, parsed);

    const uniformFile = req.files?.uniformPhotoFile?.[0];
    const niceFile = req.files?.nicePhotoFile?.[0];
    if (uniformFile) {
      data.photoUpload.uniformPhoto = await saveUserPhoto(req.session.userId, 'uniform', uniformFile);
    }
    if (niceFile) {
      data.photoUpload.nicePhoto = await saveUserPhoto(req.session.userId, 'nice', niceFile);
    }

    const user = await syncUserProfile(req.session.userId, req.body);
    if (!user) {
      clearUserSession(req);
      return res.redirect('/login');
    }
    req.session.displayName = user.fullName || user.userId;

    let emailFlags = { sent: false };
    try {
      emailFlags = await sendApplicationSaveEmail(req, user, existing);
      if (emailFlags.sent) {
        console.log(`[email] Application save email sent (${emailFlags.emailType}) to ${user.userId}`);
      } else if (emailFlags.reason) {
        console.error(`[email] Application save email skipped: ${emailFlags.reason}`);
      }
    } catch (emailErr) {
      console.error('Application save email failed:', emailErr);
      emailFlags = { sent: false, emailType: null };
    }

    await Application.findOneAndUpdate(
      { user: req.session.userId },
      {
        ...data,
        user: req.session.userId,
        hasChanges: true,
        ...(emailFlags.sent && emailFlags.registrationConfirmationEmailSent
          ? { registrationConfirmationEmailSent: true }
          : {}),
      },
      { upsert: true, new: true }
    );

    let message;
    if (data.status === 'submitted') {
      message = 'submitted';
    } else if (emailFlags.sent && emailFlags.emailType === 'created') {
      message = 'confirmed';
    } else if (emailFlags.sent && emailFlags.emailType === 'updated') {
      message = 'updated';
    } else {
      message = 'saved';
    }
    res.redirect(`/application?success=${message}`);
  } catch (err) {
    console.error(err);
    if (!req.session?.userId) {
      return res.redirect('/login');
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      clearUserSession(req);
      return res.redirect('/login');
    }
    const application = await Application.findOne({ user: req.session.userId });
    res.render('application-form', buildApplicationRenderContext(user, application, {
      error: err.message || 'Failed to save application. Please try again.',
      success: null,
    }));
  }
});

module.exports = router;
