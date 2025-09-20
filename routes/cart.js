const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController')

router.get('/user/cart/:userId', cartController.getCartItem)
router.post('/user/add-to-cart/:userId', cartController.addToCart)
router.put('/:userId/:cartItemId', cartController.updateCartQuantity)

module.exports = router;