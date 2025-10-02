const db = require('../config/database');

class ProductOption {
    static db = db;
    static async getAllOption(entityId) {
        const query = `
            SELECT po.option_id, po.name
            FROM product_entity pe JOIN product_option po
            ON pe.entity_id = po.product_id
            WHERE pe.entity_id = ?
        `
        try {
            const rows = await db.execute(query, [entityId]);
            return rows;
        } catch (err) {
            throw err;
        }
    }

    static async getValues(optionId) {
        const query = `
            SELECT pov.value_id, pov.value
            FROM product_option_value pov
            WHERE pov.option_id = ?
        `;
        try {
            const [rows] = await db.execute(query, [optionId]);
            return rows;
        } catch (err) {
            throw err;
        }
    }

    static async create(entityId, code, name) {
        const query = `
            INSERT INTO product_option (product_id, code, name, position, is_required)
            VALUES (?, ?, ?, 0, 1)
        `;
        try {
            const [result] = await db.execute(query, [entityId, code, name]);
            return { option_id: result.insertId, success: true };
        } catch (err) {
            throw err;
        }
    }

    static async hasVariants(entityId) {
        const query = `
            SELECT COUNT(*) as count
            FROM product_option
            WHERE product_id = ?
        `;
        try {
            const [rows] = await db.execute(query, [entityId]);
            return rows[0].count > 0;
        } catch (err) {
            throw err;
        }
    }

    static async getOrCreateVariantId(entityId, options = {}) {
        const valueIds = Object.values(options).filter(v => v !== null).map(Number);
        
        try {
            if (valueIds.length === 0) {
                // Trường hợp không có tùy chọn: Tái sử dụng biến thể mặc định nếu có
                const queryCheck = `
                    SELECT pv.variant_id
                    FROM product_variant pv
                    WHERE pv.product_id = ?
                `;
                const [existingVariants] = await db.execute(queryCheck, [entityId]);
                if (existingVariants.length > 0) {
                    return existingVariants[0].variant_id;
                }
            }
            
            // Tạo biến thể mới (cho trường hợp có tùy chọn hoặc không có biến thể mặc định)
            const sku = `${entityId}-${Date.now()}`;
            const queryInsert = `
                INSERT INTO product_variant (product_id, sku, price)
                VALUES (?, ?, (SELECT value FROM product_entity_decimal WHERE entity_id = ? AND attribute_id = 2))
            `;
            const [result] = await db.execute(queryInsert, [entityId, sku, entityId]);
            const newVariantId = result.insertId;

            // Gắn các giá trị tùy chọn (option values) vào biến thể mới
            for (const valueId of valueIds) {
                await db.execute(
                    `INSERT INTO product_variant_option_value (variant_id, value_id)
                    VALUES (?, ?)`,
                    [newVariantId, valueId]
                );
            }

            return newVariantId;
        } catch (err) {
            throw err;
        }
    }
    static async getVariantIdByOptions(entityId, options) {
        try {
            const valueIds = Object.values(options).filter(v => v !== null).map(Number);
            if (valueIds.length === 0) return null;

            const placeholders = valueIds.map(() => '?').join(',');
            const query = `
                SELECT pv.variant_id
                FROM product_variant pv
                JOIN product_variant_option_value pvov ON pv.variant_id = pvov.variant_id
                WHERE pv.product_id = ?
                    AND pvov.value_id IN (${placeholders})
                GROUP BY pv.variant_id
                HAVING COUNT(DISTINCT pvov.value_id) = ?
            `;

            const [rows] = await db.execute(query, [entityId, ...valueIds, valueIds.length]);
            return rows.length > 0 ? rows[0].variant_id : null;
        } catch (err) {
            throw err;
        }
    }


    static async getOptionsWithStock(productId) {
        const query = `
            SELECT 
                po.option_id, 
                po.name AS option_name, 
                pov.value_id, 
                pov.value AS option_value, 
                COALESCE(SUM(stock.quantity), 0) AS total_quantity
            FROM product_option po
            JOIN product_option_value pov 
                ON po.option_id = pov.option_id
            LEFT JOIN product_variant_option_value pvov 
                ON pov.value_id = pvov.value_id
            LEFT JOIN product_variant pv 
                ON pvov.variant_id = pv.variant_id
            LEFT JOIN (
                SELECT variant_id, SUM(quantity) AS quantity
                FROM inventory_stock_item
                GROUP BY variant_id
            ) stock 
                ON pv.variant_id = stock.variant_id
            WHERE po.product_id = ?
            GROUP BY 
                po.option_id, 
                po.name, 
                pov.value_id, 
                pov.value
            ORDER BY 
                po.option_id, 
                pov.value_id;
        `;
        
        try {
            const [rows] = await db.query(query, [productId]);
            return rows;
        } catch (err) {
            throw err;
        }
    }


    static async getAllOption(entityId) {
        const query = `
            SELECT po.option_id, po.name
            FROM product_entity pe JOIN product_option po
            ON pe.entity_id = po.product_id
            WHERE pe.entity_id = ?
        `
        try {
            const rows = await db.execute(query, [entityId]);
            return rows;
        } catch (err) {
            throw err;
        }
    }

    static async getDefaultQuantity(entityId) {
        const query = `
            SELECT isi.quantity, pv.variant_id
            FROM product_variant pv
            JOIN inventory_stock_item isi ON pv.variant_id = isi.variant_id
            WHERE pv.product_id = ?
        `;  
        try {
            const [rows] = await db.execute(query, [entityId]);
            return rows[0];
        } catch (err) {
            throw err;
        }
    }

    static async getVariantDetails(variantId) {
        const query = `
            SELECT
                pv.*,
                COALESCE(stock.total_quantity, 0) AS quantity
            FROM product_variant pv
            LEFT JOIN (
                SELECT variant_id, SUM(quantity) AS total_quantity
                FROM inventory_stock_item
                GROUP BY variant_id
            ) stock ON stock.variant_id = pv.variant_id
            WHERE pv.variant_id = ?
        `;
        try {
            const [rows] = await db.execute(query, [variantId]);
            return rows.length > 0 ? rows[0] : {};
        } catch (err) {
            throw err;
        }
    }

    static async getAllVariants(productId) {
        const query = `
            SELECT
                pv.variant_id,
                pv.sku,
                COALESCE(stock.total_quantity, 0) AS quantity,
                opts.options,
                opts.option_key
            FROM product_variant pv
            LEFT JOIN (
                SELECT variant_id, SUM(quantity) AS total_quantity
                FROM inventory_stock_item
                GROUP BY variant_id
            ) stock ON stock.variant_id = pv.variant_id
            LEFT JOIN (
                SELECT
                    pvov.variant_id,
                    GROUP_CONCAT(CONCAT(po.name, ':', pov.value) ORDER BY po.option_id SEPARATOR ', ') AS options,
                    GROUP_CONCAT(pov.value_id ORDER BY po.option_id SEPARATOR '-') AS option_key
                FROM product_variant_option_value pvov
                JOIN product_option_value pov ON pvov.value_id = pov.value_id
                JOIN product_option po ON pov.option_id = po.option_id
                GROUP BY pvov.variant_id
            ) opts ON opts.variant_id = pv.variant_id
            WHERE pv.product_id = ?
            ORDER BY pv.variant_id;
        `;
        try {
            const [rows] = await db.query(query, [productId]);
            return rows;
        } catch (err) {
            throw err;
        }
    }

}

module.exports = ProductOption;

