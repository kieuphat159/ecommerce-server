const cart = require('../models/Cart')

exports.addToCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const {variantId, quantity, unit_price, total_price} = req.body;
        if (!userId || !variantId || quantity == null || unit_price == null || total_price == null) {
            const msg = 'Missing value';
            console.log('Err: ', msg);
            return res.status(500).json({
                success: false,
                message: msg
            })
        }
        const result = await cart.addToCart(userId, variantId, quantity, unit_price, total_price);
        res.json({
            success: true,
            data: result
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
}

exports.getCartItem = async (req, res) => {
    try {
        const { userId } = req.params;
        const cartData = await cart.getCartItem(userId);
        res.json({
            success: true,
            data: cartData
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error getting cart item',
            error: err.message
        })
    }
}

exports.updateCartQuantity = async (req, res) => {
    try {
        const { userId, cartItemId } = req.params;
        const { quantity } = req.body;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: "Quantity must be >= 1" });
        }
    } catch (err) {}
}