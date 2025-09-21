const db = require('../config/database')

class Order {
    static async placeOrder(cart_id, payment_method) {
        const connection = await db.getConnection();
        try {
            const [rows] = await db.query(`
                SELECT cart_id, user_id, total_amount
                FROM cart
                WHERE cart_id = ? AND status = 'pending'
            `, [cart_id]
            )
            
            if (rows.length === 0) {
                throw new Error('Cart does not exist');
            }
            const user_id = rows[0].user_id;
            const total_amount = rows[0].total_amount;
            

            await connection.beginTransaction();

            await connection.query(`
                UPDATE cart
                SET status = ?
                WHERE cart_id = ?
            `, ['completed', cart_id]
            );

            const [result] = await connection.query(`
                INSERT INTO \`order\` (user_id, status, total_amount, payment_method)
                VALUES (?, ?, ?, ?)
            `, [user_id, 'pending', total_amount, payment_method]
            );
            const order_id = result.insertId;

            const [items] = await connection.query(`
                SELECT variant_id, quantity, unit_price, total_price
                FROM cart_item
                WHERE cart_id = ?
            `, [cart_id]
            )
            for (let item of items) {
                await connection.query(`
                    INSERT INTO order_item (order_id, variant_id, quantity, unit_price, total_price)
                    VALUES (?, ?, ?, ?, ?)
                `, [order_id, item.variant_id, item.unit_price, item.total_price]
                );
            }
            connection.commit();
            return order_id;
        } catch (err) {
            connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async getOrder(order_id) {
        try {
            const [rows] = await db.query(`
                SELECT order_id, status, created_at, total_amount, payment_method
                FROM \`order\`
                WHERE order_id = ?
            `, [order_id]
            )
            return rows;
        } catch (err) {
            throw err;
        }
    }

    static async getAllOrders(user_id) {
        try {
            const [rows] = await db.query(`
                SELECT * FROM \`order\`
                WHERE user_id = ?   
            `, [user_id]
            )
            return rows;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Order;