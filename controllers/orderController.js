const order = require('../models/Order');

exports.placeOrder = async (req, res) => {
    const { cartId } = req.params;
    const { paymentMethod } = req.body;
    try {
        const orderId = await order.placeOrder(cartId, paymentMethod);
        res.json({
            success: true,
            message: 'Order completed',
            orderId: orderId
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error completing order'
        })
        throw err;
    }
}

exports.getOrder = async (req, res) => {
    const { orderId } = req.params;
    try {
        const data = await order.getOrder(orderId);
        console.log(data);
        res.json({
            success: true,
            data: data
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error getting order'
        })
    }
}

exports.getAllOrders = async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    try {
        const orders = await order.getAllOrders(userId, page, limit);
        res.json({
            success: true,
            data: orders
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error getting order'
        })
    }
}