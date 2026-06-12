const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/application');
  }
  res.render('home');
});

router.get('/register', (req, res) => {
  res.render('register');
});

module.exports = router;
