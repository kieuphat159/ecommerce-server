const express = require('express');
const { signup, signin, refresh } = require('../controllers/authController');
const { getSellerPage } = require('../controllers/sellerController');
const { authenticateToken, requireSellerRole } = require('../middleware/authMiddleware');
const router = express.Router();

// routes khong can xac thuc
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh', refresh);

// routes can xac thuc role seller
router.get('/seller', authenticateToken, requireSellerRole, getSellerPage);

module.exports = router;