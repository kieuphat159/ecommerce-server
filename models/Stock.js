const db = require('../config/database');

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

    static async getStockQuantity(variantId) {
        const query = `
            SELECT isi.quantity, is.stock_name
            FROM inventory_stock_item isi
            JOIN inventory_stock is ON isi.stock_id = is.stock_id
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

