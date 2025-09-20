const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController')

router.get('/user/cart/:userId', cartController.getCartItem)
router.post('/user/add-to-cart/:userId', cartController.addToCart)
router.delete('/user/delete-cart-item/:cartItemId', cartController.removeCartItem)

module.exports = router;