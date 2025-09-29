const db = require('../config/database');
const ProductOption = require('../models/ProductOption')

class Stock {
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

    static async getStockQuantity(variantId, stockId = null) {
        let query = `
            SELECT isi.quantity, st.stock_name
            FROM inventory_stock_item isi
            JOIN inventory_stock st ON isi.stock_id = st.stock_id
            WHERE isi.variant_id = ?
        `;
        let params = [variantId];
        if (stockId) {
            query += ` AND isi.stock_id = ?`;
            params.push(stockId);
        }
        try {
            const [rows] = await db.execute(query, params);
            if (stockId) {
                return rows.length > 0 ? rows[0] : { quantity: 0, stock_name: null };
            } else {
                return rows;
            }
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

    static async getTotalProductQuantity(productId) {
        const query = `
            SELECT 
                pe.entity_id AS product_id,
                pe.sku AS product_sku,
                COALESCE(SUM(isi.quantity), 0) AS total_quantity
            FROM product_entity pe
            JOIN product_variant pv 
                ON pe.entity_id = pv.product_id
            LEFT JOIN inventory_stock_item isi 
                ON pv.variant_id = isi.variant_id
            WHERE pe.entity_id = ?
            GROUP BY pe.entity_id, pe.sku
        `;
        try {
            const [rows] = await db.execute(query, [productId]);
            return rows.length > 0 ? rows[0] : { product_id: productId, total_quantity: 0 };
        } catch (err) {
            throw err;
        }
    }

}

module.exports = Stock;