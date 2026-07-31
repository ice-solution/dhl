/**
 * When SITE_CLOSED=true, redirect all public routes to /thank-you.
 * Admin (/admin*) remains accessible.
 */
function siteClosedRedirect(req, res, next) {
  if (process.env.SITE_CLOSED !== 'true') {
    return next();
  }

  const path = req.path || '';
  if (path === '/thank-you' || path.startsWith('/admin')) {
    return next();
  }

  return res.redirect('/thank-you');
}

module.exports = {
  siteClosedRedirect,
};
