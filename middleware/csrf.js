const csrf = require('csurf');

const csrfProtection = csrf();

function exposeCsrfToken(req, res, next) {
  try {
    res.locals.csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
  } catch {
    res.locals.csrfToken = '';
  }
  next();
}

function handleCsrfError(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  if (req.accepts('html')) {
    return res.status(403).send('Session expired or invalid form submission. Please go back and try again.');
  }

  return res.status(403).json({ error: 'Invalid CSRF token' });
}

module.exports = {
  csrfProtection,
  exposeCsrfToken,
  handleCsrfError,
};
