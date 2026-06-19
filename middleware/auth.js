const User = require('../models/User');

function clearUserSession(req) {
  if (!req.session) return;
  delete req.session.userId;
  delete req.session.displayName;
  delete req.session.regJustCreated;
}

async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect('/login');
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      clearUserSession(req);
      return res.redirect('/login');
    }
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

module.exports = {
  requireAuth,
  requireAdmin,
  clearUserSession,
};
