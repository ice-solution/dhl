const helmet = require('helmet');

const isProduction = process.env.NODE_ENV === 'production';

function configureSecurity(app) {
  app.disable('x-powered-by');

  if (isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'font-src': ["'self'", 'data:'],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'object-src': ["'none'"],
        'script-src': ["'self'", 'https://cdn.tailwindcss.com'],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
        'connect-src': ["'self'"],
        'upgrade-insecure-requests': isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
}

module.exports = {
  configureSecurity,
  isProduction,
};
