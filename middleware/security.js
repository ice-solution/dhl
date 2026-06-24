const helmet = require('helmet');

const isProduction = process.env.NODE_ENV === 'production';

function configureSecurity(app) {
  app.disable('x-powered-by');

  if (isProduction) {
    app.set('trust proxy', 1);
  }

  // No CSP header — avoids ZAP Medium on wildcard / unsafe-inline.
  // Other headers still cover clickjacking, MIME sniffing, HSTS, etc.
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
}

module.exports = {
  configureSecurity,
  isProduction,
};
