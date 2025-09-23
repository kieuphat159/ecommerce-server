const express = require('express');
const { signup, signin, refresh, getUserInfo } = require('../controllers/authController');
const { getSellerPage } = require('../controllers/sellerController');
const { authenticateToken, requireSellerRole, requireCustomerRole } = require('../middleware/authMiddleware');
const router = express.Router();

// routes khong can xac thuc
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh', refresh);

router.get('/user/:userId', authenticateToken, requireCustomerRole, getUserInfo);

// routes can xac thuc role seller
router.get('/seller', authenticateToken, requireSellerRole, getSellerPage);

module.exports = router;