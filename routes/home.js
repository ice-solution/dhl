const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('home');
});

router.get('/thank-you', (req, res) => {
  res.render('thank-you');
});

module.exports = router;
