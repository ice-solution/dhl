const express = require('express');
const User = require('../models/User');
const { requireAuth, requirePasswordChanged, clearUserSession } = require('../middleware/auth');
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

function getPostLoginRedirect(user) {
  return user.mustChangePassword ? '/change-password' : '/application';
}

function validateNewPassword(password, confirmPassword) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
}

router.get('/login', async (req, res) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user) {
      return res.redirect(getPostLoginRedirect(user));
    }
    clearUserSession(req);
  }
  res.render('login', { error: null, userId: '' });
});

router.get('/forgot-password', async (req, res) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user) {
      return res.redirect(getPostLoginRedirect(user));
    }
    clearUserSession(req);
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
      html: FORGOT_PASSWORD.buildEmailHtml({
        firstName: user.givenName || '',
        lastName: user.surname || '',
        email: user.userId,
        password: newPassword,
        siteUrl: getSiteUrl(req),
      }),
    });

    user.password = newPassword;
    user.mustChangePassword = true;
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
    res.redirect(getPostLoginRedirect(user));
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

router.get('/change-password', requireAuth, async (req, res) => {
  if (!req.user.mustChangePassword) {
    return res.redirect('/application');
  }
  res.render('change-password', { error: null });
});

router.post('/change-password', requireAuth, async (req, res) => {
  if (!req.user.mustChangePassword) {
    return res.redirect('/application');
  }

  const password = req.body.password || '';
  const confirmPassword = req.body.confirmPassword || '';
  const validationError = validateNewPassword(password, confirmPassword);

  if (validationError) {
    return res.render('change-password', { error: validationError });
  }

  try {
    req.user.password = password;
    req.user.mustChangePassword = false;
    await req.user.save();
    res.redirect('/application');
  } catch (err) {
    console.error('Change password error:', err);
    res.render('change-password', {
      error: 'Unable to update password. Please try again.',
    });
  }
});

router.get('/account', requireAuth, requirePasswordChanged, async (req, res) => {
  res.render('account', { user: req.user });
});

module.exports = router;
