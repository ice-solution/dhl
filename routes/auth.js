const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendEmail } = require('../lib/email');
const { generatePassword } = require('../lib/password');
const { getSiteUrl } = require('../lib/site-url');
const { FORGOT_PASSWORD } = require('../data/message-templates');

const router = express.Router();

function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return User.findOne({
    $or: [
      { userId: normalized },
      { email: normalized },
    ],
  });
}

router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/application');
  }
  res.render('login', { error: null, userId: '' });
});

router.get('/forgot-password', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/application');
  }
  res.render('forgot-password', {
    error: null,
    success: null,
    email: '',
  });
});

router.post('/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!email) {
    return res.render('forgot-password', {
      error: 'Please enter your registered email address.',
      success: null,
      email: req.body.email || '',
    });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.render('forgot-password', {
        error: FORGOT_PASSWORD.notRegisteredMessage,
        success: null,
        email: req.body.email || '',
      });
    }

    const newPassword = generatePassword();
    const recipient = user.email || user.userId;
    const emailBody = FORGOT_PASSWORD.buildEmailBody({
      firstName: user.givenName || '',
      lastName: user.surname || '',
      email: user.userId,
      password: newPassword,
      siteUrl: getSiteUrl(req),
    });

    await sendEmail({
      to: recipient,
      subject: FORGOT_PASSWORD.emailSubject,
      body: emailBody,
    });

    user.password = newPassword;
    await user.save();

    res.render('forgot-password', {
      error: null,
      success: FORGOT_PASSWORD.successMessage,
      email: '',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('forgot-password', {
      error: 'Unable to send password reset email. Please try again later or contact the Event Secretariat.',
      success: null,
      email: req.body.email || '',
    });
  }
});

router.post('/login', async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await User.findOne({ userId: userId?.trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', {
        error: 'Invalid User ID or Password.',
        userId: userId || '',
      });
    }

    req.session.userId = user._id.toString();
    req.session.displayName = user.fullName || user.userId;
    res.redirect('/application');
  } catch (err) {
    console.error(err);
    res.render('login', {
      error: 'Login failed. Please try again.',
      userId: userId || '',
    });
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
