require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/application');
const adminRoutes = require('./routes/admin');
const formOptions = require('./data/form-options');

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
  res.locals.getOptions = formOptions.getOptions;
  res.locals.getDateOptions = formOptions.getDateOptions;
  res.locals.getTimeOptions = formOptions.getTimeOptions;
  next();
});

app.use(authRoutes);
app.use(applicationRoutes);
app.use(adminRoutes);

app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/application');
  }
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
