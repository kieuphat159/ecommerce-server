const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController')
const { authenticateToken, requireCustomerRole, requireSellerRole } = require('../middleware/authMiddleware')


router.post('/user/place-order/:cartId', authenticateToken, requireCustomerRole, orderController.placeOrder);
router.get('/user/order/:orderId', authenticateToken, requireCustomerRole, orderController.getOrder);
router.get('/user/order-item/:orderId', authenticateToken, requireCustomerRole, orderController.getOrderItem)
router.get('/user/my-orders/:userId', authenticateToken, requireCustomerRole, orderController.getAllOrders);
router.delete('/user/order/:orderId', authenticateToken, requireCustomerRole, orderController.deleteOrder);

router.delete('/seller/orders/:orderId', authenticateToken, requireSellerRole, orderController.deleteOrder);
router.get('/seller/orders', orderController.getAllOrdersExist);

module.exports = router;