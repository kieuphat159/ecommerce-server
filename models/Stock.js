const db = require('../config/database');
const ProductOption = require('../models/ProductOption')

class Stock {
    static async getVariantIdByOptions(entityId, options) {
        const query = `
            SELECT pv.variant_id
            FROM product_variant pv
            JOIN product_variant_option_value pvov ON pv.variant_id = pvov.variant_id
            JOIN product_option_value pov ON pvov.value_id = pov.value_id
            JOIN product_option po ON pov.option_id = po.option_id
            WHERE pv.product_id = ? AND pov.value IN (?, ?)
            GROUP BY pv.variant_id
            HAVING COUNT(DISTINCT po.code) = 2
        `;
        try {
            const [rows] = await db.execute(query, [entityId, options.size, options.color]);
            return rows.length > 0 ? rows[0].variant_id : null;
        } catch (err) {
            throw err;
        }
    }

    static async getAllStocks() {
        const query = `
            SELECT stock_id, stock_name
            FROM inventory_stock
        `;
        try {
            const [rows] = await db.execute(query);
            return rows;
        } catch (err) {
            throw err;
        }
    }

    static async getStockQuantity(variantId) {
        const query = `
            SELECT isi.quantity, st.stock_name
            FROM inventory_stock_item isi
            JOIN inventory_stock st ON isi.stock_id = st.stock_id
            WHERE isi.variant_id = ?
        `;
        try {
            const [rows] = await db.execute(query, [variantId]);
            return rows.length > 0 ? rows[0] : { quantity: 0, stock_name: null };
        } catch (err) {
            throw err;
        }
    }

    static async updateStockQuantity(variantId, stockId, quantity) {
        const query = `
            INSERT INTO inventory_stock_item (variant_id, stock_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = ?
        `;
        try {
            await db.execute(query, [variantId, stockId, quantity, quantity]);
            return { success: true };
        } catch (err) {
            throw err;
        }
    }

    static async addStockQuantity(entityId, stockId, quantity, options = {}) {
        try {

            let variantId;

            if (await ProductOption.hasVariants(entityId)) {
                variantId = await ProductOption.getVariantIdByOptions(entityId, options);

                if (!variantId) {
                    variantId = await ProductOption.getOrCreateVariantId(entityId, options);
                }
            } else {
                variantId = await ProductOption.getOrCreateVariantId(entityId);
            }

            const [rows] = await db.execute(
                `SELECT item_id, quantity 
                FROM inventory_stock_item 
                WHERE variant_id = ? AND stock_id = ?`,
                [variantId, stockId]
            );

            let newQuantity;

            if (rows.length > 0) {
                const currentQuantity = rows[0].quantity || 0;
                newQuantity = currentQuantity + quantity;

                await db.execute(
                    `UPDATE inventory_stock_item 
                    SET quantity = ? 
                    WHERE variant_id = ? AND stock_id = ?`,
                    [newQuantity, variantId, stockId]
                );

            } else {
            newQuantity = quantity;

            await db.execute(
                `INSERT INTO inventory_stock_item (variant_id, stock_id, quantity) 
                VALUES (?, ?, ?)`,
                [variantId, stockId, newQuantity]
            );

            }

            return { success: true, variantId, newQuantity };
        } catch (err) {
            throw err;
        }
    }

    static async getAllStockQuantities(entityId) {
        const query = `
            SELECT pv.variant_id, pv.sku, isi.quantity, is.stock_name
            FROM product_entity pe
            JOIN product_variant pv ON pe.entity_id = pv.product_id
            LEFT JOIN inventory_stock_item isi ON pv.variant_id = isi.variant_id
            LEFT JOIN inventory_stock is ON isi.stock_id = is.stock_id
            WHERE pe.entity_id = ?
        `;
        try {
            const [rows] = await db.execute(query, [entityId]);
            return rows;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Stock;

