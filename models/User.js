const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, username, email, password, role = 'customer' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO user (name, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, username, email, hashedPassword, role]
    );
    return result.insertId;
  }

  static async findByUserId(userId) {
     const [rows] = await db.execute(
      'SELECT * FROM user WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await db.execute(
      'SELECT * FROM user WHERE username = ? OR email = ?',
      [username, username]
    );
    return rows[0];
  }

  static async verifyPassword(password, hasedPassword) {
    return bcrypt.compare(password, hasedPassword);
  }

  static async getSellerMail() {
    const query = `
      SELECT email
      FROM user
      WHERE role = ?
    `
    try {
      const [rows] = await db.query(query, ['seller']);
      return rows[0].email;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = User;