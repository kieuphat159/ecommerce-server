const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController')
const { authenticateToken, requireCustomerRole } = require('../middleware/authMiddleware')


router.post('/user/place-order/:cartId', authenticateToken, requireCustomerRole, orderController.placeOrder);
router.get('/user/order/:orderId', authenticateToken, requireCustomerRole, orderController.getOrder);
router.get('/user/my-orders/:userId', authenticateToken, requireCustomerRole, orderController.getAllOrders);

module.exports = router;