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

            const dbPrice = parseFloat(check[0].price);
            const sumPrice = dbPrice * quantity;
            const eps = 1e-5;

            if (Math.abs(unit_price - dbPrice) > eps || Math.abs(total_price - sumPrice) > eps) {
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
        try {
            const [rows] = await db.query(`
                SELECT 
                    c.cart_id,
                    ci.cart_item_id,
                    ci.variant_id,
                    ci.quantity,
                    ci.unit_price,
                    ci.total_price,

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
                FROM cart c
                JOIN cart_item ci 
                    ON c.cart_id = ci.cart_id
                JOIN product_variant pv 
                    ON ci.variant_id = pv.variant_id
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

                WHERE c.user_id = ? 
                AND c.status = 'pending'
                GROUP BY 
                    c.cart_id, ci.cart_item_id, ci.variant_id, ci.quantity, ci.unit_price, ci.total_price,
                    pe.entity_id, pe.sku, pv.sku, pv.price, pv_name.value, pv_image.value, pt_desc.value, u.name, isi.quantity
            `, [userId]);

            return rows;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Cart;
