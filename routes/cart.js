const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController')

router.get('/user/cart/:id', cartController.getCartItem)
router.post('/')

module.exports = router;