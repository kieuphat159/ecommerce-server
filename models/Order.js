const db = require('../config/database')

class Order {
    static async placeOrder(cart_id, payment_method, first_name, last_name, phone_number, email_address) {
        console.log(cart_id);
        const connection = await db.getConnection();
        try {
            const [rows] = await db.query(`
                SELECT cart_id, user_id, total_amount
                FROM cart
                WHERE cart_id = ? AND status = 'pending'
            `, [cart_id]);

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
            `, ['completed', cart_id]);

            const [result] = await connection.query(`
                INSERT INTO \`order\` 
                    (user_id, first_name, last_name, phone_number, email_address, status, total_amount, payment_method)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                user_id,
                first_name,
                last_name,
                phone_number,
                email_address,
                'pending',
                total_amount,
                payment_method
            ]);

            const order_id = result.insertId;

            const [items] = await connection.query(`
                SELECT variant_id, quantity, unit_price, total_price
                FROM cart_item
                WHERE cart_id = ?
            `, [cart_id]);

            for (let item of items) {
                await connection.query(`
                    INSERT INTO order_item (order_id, variant_id, quantity, unit_price, total_price)
                    VALUES (?, ?, ?, ?, ?)
                `, [order_id, item.variant_id, item.quantity, item.unit_price, item.total_price]);
            }

            await connection.commit();
            return order_id;
        } catch (err) {
            await connection.rollback();
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

    static async getAllOrders(user_id, page = 1, limit = 5) {
        try {
            const offset = (page - 1) * limit;
            const [[{ total }]] = await db.query(
                `SELECT COUNT(*) as total FROM \`order\` WHERE user_id = ?`,
                [user_id]
            );

            const [rows] = await db.query(`
                SELECT *
                FROM \`order\`
                WHERE user_id = ?
                ORDER BY created_at DESC
                 LIMIT ${offset}, ${limit}
            `, [user_id]
            );

            return {
                orders: rows,
                totalItems: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            };
        } catch (err) {
            throw err;
        }
    }

    static async getAllOrdersExist(page = 1, limit = 5) {
    try {
        const offset = (page - 1) * limit;

        const [countRows] = await db.query(
            "SELECT COUNT(*) as total FROM `order`"
        );
        const [rows] = await db.query(`
            SELECT order_id, first_name, last_name, phone_number, email_address, status, total_amount, payment_method, created_at
            FROM \`order\`
            ORDER BY created_at DESC
            LIMIT ?, ?
        `, [offset, limit]);

        return {
            orders: rows,
            totalItems: countRows[0].total,
            totalPages: Math.ceil(countRows[0].total / limit),
            currentPage: page
        };
        } catch (err) {
            console.error("getAllOrdersExist error:", err);
            throw err;
        }
    }

    static async deleteOrder(orderId) {
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            const item = `
                DELETE FROM order_item
                WHERE order_id = ?
            `
            await connection.query(item, [orderId]);
            const query = `
                DELETE FROM \`order\`
                WHERE order_id = ?
            `
            await connection.query(query, [orderId]);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async getOrderItem(orderId) {
        try {
            const [rows] = await db.query(`
                SELECT 
                    oi.order_item_id,
                    oi.variant_id,
                    oi.quantity,
                    oi.unit_price,
                    oi.total_price,

                    -- Product info
                    pe.entity_id AS product_id,
                    pe.sku AS product_sku,
                    pv.sku AS variant_sku,
                    pv.price AS variant_price,
                    
                    pv_name.value AS name,
                    pv_image.value AS image_path,
                    pt_desc.value AS description,
                    u.name AS seller_name,

                    -- Stock info
                    COALESCE(isi.quantity, 0) AS stock_quantity,

                    -- Variant attributes (size, color,...)
                    GROUP_CONCAT(DISTINCT CONCAT(po.name, ': ', pov.value) SEPARATOR ', ') AS variant_attributes

                FROM \`order\` o
                JOIN order_item oi 
                    ON o.order_id = oi.order_id
                JOIN product_variant pv 
                    ON oi.variant_id = pv.variant_id
                JOIN product_entity pe 
                    ON pv.product_id = pe.entity_id

                -- Join name
                LEFT JOIN product_entity_varchar pv_name 
                    ON pe.entity_id = pv_name.entity_id 
                    AND pv_name.attribute_id = 1

                -- Join image
                LEFT JOIN product_entity_varchar pv_image 
                    ON pe.entity_id = pv_image.entity_id 
                    AND pv_image.attribute_id = 3

                -- Join description
                LEFT JOIN product_entity_text pt_desc 
                    ON pe.entity_id = pt_desc.entity_id 
                    AND pt_desc.attribute_id = 4

                -- Join seller
                LEFT JOIN product_entity_int pi_seller 
                    ON pe.entity_id = pi_seller.entity_id 
                    AND pi_seller.attribute_id = 6
                LEFT JOIN user u 
                    ON pi_seller.value = u.user_id

                -- Join stock
                LEFT JOIN inventory_stock_item isi 
                    ON pv.variant_id = isi.variant_id

                -- Join variant attributes
                LEFT JOIN product_variant_option_value pvov 
                    ON pv.variant_id = pvov.variant_id
                LEFT JOIN product_option_value pov 
                    ON pvov.value_id = pov.value_id
                LEFT JOIN product_option po 
                    ON pov.option_id = po.option_id

                WHERE o.order_id = ?
                GROUP BY oi.order_item_id, oi.variant_id, oi.quantity, oi.unit_price, oi.total_price,
                        pe.entity_id, pe.sku, pv.sku, pv.price,
                        pv_name.value, pv_image.value, pt_desc.value, u.name, isi.quantity
            `, [orderId]);

            return rows;
        } catch (err) {
            throw err;
        }
    }


}

module.exports = Order;