const order = require('../models/Order');
const user = require('../models/User')
const mailer = require('../services/mailer')

exports.placeOrder = async (req, res) => {
    const { cartId } = req.params;
    let orderId;
    const { 
        paymentMethod, 
        firstName, 
        lastName, 
        phoneNumber, 
        emailAddress 
    } = req.body;

    try {
        orderId = await order.placeOrder(
            cartId, 
            paymentMethod, 
            firstName, 
            lastName, 
            phoneNumber, 
            emailAddress
        );
        res.json({
            success: true,
            message: 'Order completed',
            orderId: orderId
        });
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).json({
            success: false,
            message: 'Error completing order'
        });
    } finally {
        const sellerMail = await user.getSellerMail();
        console.log('seller mail: ', sellerMail);

        await mailer.sendMail(
            sellerMail,
            "New order received",
            `
                <h2>New order placed</h2>
                <p>Order ID: <b>${orderId}</b></p>
                <p>Customer: ${firstName} ${lastName}</p>
                <p>Email: ${emailAddress}</p>
                <p>Phone: ${phoneNumber}</p>
                <p>Payment method: ${paymentMethod}</p>
            `
        );

        await mailer.sendMail(
            emailAddress,
            "Order confirmation",
            `
                <h2>Dear ${firstName} ${lastName},</h2>
                <p>Thank you for placing order at <b>3legant</b>.</p>
                <p>Your order id: <b>${orderId}</b></p>
                <p>Payment method: ${paymentMethod}</p>
                <p>We'll contact to ${phoneNumber} when the order is processing.</p>
                <br/>
                <p>Best regrads,</p>
                <p>3legant</p>
            `
        );
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

exports.getAllOrdersExist = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    try {
        const orders = await order.getAllOrdersExist(page, limit);
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

exports.deleteOrder = async (req, res) => {
    const { orderId } = req.params;
    const orderData = await order.getOrder(orderId);
    try {
        

        await order.deleteOrder(orderId);

        
        res.json({
            success: true,
            message: 'Cancel order successful and seller notified'
        });
    } catch (err) {
        console.error("Cancel order error:", err);
        res.status(500).json({
            success: false,
            message: 'Error cancelling order'
        });
    } finally {

        if (!orderData) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        const sellerMail = await user.getSellerMail();

        if (sellerMail) {
            await mailer.sendMail(
                sellerMail,
                "Order cancelled",
                `
                    <h2>Order cancelled</h2>
                    <p>Order ID: <b>${orderId}</b></p>
                    <p>Customer: ${orderData.first_name} ${orderData.last_name}</p>
                    <p>Email: ${orderData.email}</p>
                    <p>Phone: ${orderData.phone}</p>
                    <p><b>The customer has cancelled this order.</b></p>
                `
            );
        }

    }
};




exports.getOrderItem = async (req, res) => {
    console.log('okok');
    try {
        const { orderId } = req.params;
        const orderData = await order.getOrderItem(orderId);
        res.json({
            success: true,
            data: orderData
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error getting order item',
            error: err.message
        })
        throw err;
    }
}

exports.setStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    try {
        await order.setStatus(orderId, status);
        res.json({
            success: true,
            message: 'Order status updated'
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        })
        throw err;
    }
}