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
}

module.exports = ProductOption;

