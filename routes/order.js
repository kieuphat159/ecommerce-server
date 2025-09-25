const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController')
const { authenticateToken, requireCustomerRole, requireSellerRole } = require('../middleware/authMiddleware')


router.post('/user/place-order/:cartId', authenticateToken, requireCustomerRole, orderController.placeOrder);
router.get('/user/order/:orderId', authenticateToken, requireCustomerRole, orderController.getOrder);
router.get('/user/order-item/:orderId', authenticateToken, requireCustomerRole, orderController.getOrderItem)
router.get('/user/my-orders/:userId', authenticateToken, requireCustomerRole, orderController.getAllOrders);
router.delete('/user/order/:orderId', authenticateToken, requireCustomerRole, orderController.deleteOrder);

router.get('/seller/order-item/:orderId', authenticateToken, requireSellerRole, orderController.getOrderItem)
router.get('/seller/order/:orderId', authenticateToken, requireSellerRole, orderController.getOrder);
router.delete('/seller/orders/:orderId', authenticateToken, requireSellerRole, orderController.deleteOrder);
router.get('/seller/orders', authenticateToken, requireSellerRole, orderController.getAllOrdersExist);
router.put('/seller/order/status/:orderId', authenticateToken, requireSellerRole, orderController.setStatus);

module.exports = router;