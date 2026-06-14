const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/application');
const adminRoutes = require('./routes/admin');
const homeRoutes = require('./routes/home');
const registerRoutes = require('./routes/register');
const formOptions = require('./data/form-options');
const { getSiteUrl } = require('./lib/site-url');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/super-stars';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'super-stars-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGODB_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
  },
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.siteUrl = getSiteUrl(req);
  res.locals.getOptions = formOptions.getOptions;
  res.locals.getDateOptions = formOptions.getDateOptions;
  res.locals.getTimeOptions = formOptions.getTimeOptions;
  next();
});

app.use(homeRoutes);
app.use(registerRoutes);
app.use(authRoutes);
app.use(applicationRoutes);
app.use(adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
