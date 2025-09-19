const db = require('../config/database')

class Cart {
    static async checkExistCart(userId) {
        try {
            const [rows] = await db.query(`
                SELECT cart_id
                FROM cart
                WHERE user_id = ? AND status = 'pending'
            `, [userId]);
            if (rows.length > 0) {
                return rows[0].cart_id;
            }
        } catch (err) {
            throw new Error(err.message);
        }
        return -1;
    }

    static async addToCart(userId, variantId, quantity, unit_price, total_price) {
        const conn = await db.getConnection();
        try {
            let cart_id = await Cart.checkExistCart(userId);
            if (cart_id === -1) {
                const [result] = await conn.query(`
                    INSERT INTO cart(user_id, status, total_amount)
                    VALUES(?, 'pending', 0.00)
                `, [userId]);
                cart_id = result.insertId;
            }

            // kiểm tra giá
            const [check] = await conn.query(`
                SELECT price
                FROM product_variant
                WHERE variant_id = ?
            `, [variantId]);

            if (check.length === 0) {
                throw new Error("Variant không tồn tại");
            }

            const sumPrice = check[0].price * quantity;
            if (unit_price !== check[0].price || sumPrice !== total_price) {
                console.log('Price is not match');
                return;
            }

            await conn.beginTransaction();

            // kiểm tra giỏ hàng đã có variant chưa
            const [rows] = await conn.query(`
                SELECT cart_item_id, quantity
                FROM cart_item
                WHERE cart_id = ? AND variant_id = ?
            `, [cart_id, variantId]);

            if (rows.length > 0) {
                const newQuantity = quantity + rows[0].quantity;
                await conn.query(`
                    UPDATE cart_item 
                    SET quantity = ?, total_price = ?
                    WHERE cart_item_id = ?
                `, [newQuantity, check[0].price * newQuantity, rows[0].cart_item_id]);
            } else {
                await conn.query(`
                    INSERT INTO cart_item(cart_id, variant_id, unit_price, total_price, quantity)
                    VALUES(?, ?, ?, ?, ?)
                `, [cart_id, variantId, unit_price, total_price, quantity]);
            }

            // update cart's total_amount
            await conn.query(`
                UPDATE cart
                SET total_amount = total_amount + ?
                WHERE cart_id = ?
            `, [total_price, cart_id]);

            await conn.commit();
            return cart_id;
        } catch (err) {
            await conn.rollback();
            throw new Error(err.message);
        } finally {
            conn.release();
        }
    }

    static async getCartItem(userId) {
        const [rows] = await db.query(`
            SELECT c.cart_id, ci.cart_item_id, ci.variant_id, ci.quantity, ci.unit_price, ci.total_price
            FROM cart c
            JOIN cart_item ci ON c.cart_id = ci.cart_id
            WHERE c.user_id = ? AND c.status = 'pending'
        `, [userId]);

        return rows;
    }
}

module.exports = Cart;
