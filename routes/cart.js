const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController')
const { authenticateToken, requireCustomerRole } = require('../middleware/authMiddleware')

router.get('/user/cart/:userId', authenticateToken, requireCustomerRole, cartController.getCartItem)
router.post('/user/add-to-cart/:userId', authenticateToken, requireCustomerRole, cartController.addToCart)
router.delete('/user/delete-cart-item/:cartItemId', authenticateToken, requireCustomerRole,cartController.removeCartItem)

module.exports = router;