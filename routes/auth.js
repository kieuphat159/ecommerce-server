const express = require('express');
const { signup, signin, getSellerPage } = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/seller', getSellerPage);

module.exports = router;