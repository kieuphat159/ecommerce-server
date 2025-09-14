const db = require('../config/database');

class Category {
    static async findAll() {
        const query = `
            SELECT category_id, name
            FROM category
            WHERE is_active = 1
        `;
        try {
            const [rows] = await db.execute(query);
            return rows;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Category;