const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: '' + process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'ecommerce_db',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool.promise();