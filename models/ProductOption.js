const db = require('../config/database');

class ProductOption {
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
        const queryCheck = `
            SELECT pv.variant_id, pv.sku
            FROM product_variant pv
            WHERE pv.product_id = ?
        `;
        try {
            const [existingVariants] = await db.execute(queryCheck, [entityId]);

            if (existingVariants.length > 0) {
                return existingVariants[0].variant_id;
            }

            const sku = `${entityId}-DEFAULT-001`;
            const queryInsert = `
                INSERT INTO product_variant (product_id, sku, price)
                VALUES (?, ?, (SELECT value FROM product_entity_decimal WHERE entity_id = ? AND attribute_id = 2))
            `;
            const [result] = await db.execute(queryInsert, [entityId, sku, entityId]);
            return result.insertId;
        } catch (err) {
            throw err;
        }
    }


    static async getVariantIdByOptions(entityId, options) {
    try {
        const valueIds = Object.values(options).filter(v => v !== null);


        if (valueIds.length === 0) {
            return null;
        }

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


}

module.exports = ProductOption;

