const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload')
const productsRoutes = require('./routes/productEAV')
const categoriesRoutes = require('./routes/category')
const stockRoutes = require('./routes/stock')
const productOptionsRoutes = require('./routes/productOption')
const cartRoutes = require('./routes/cart')
const orderRoutes = require('./routes/order')
const pool = require('./config/database')

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,               
}));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api', uploadRoutes)

app.use('/api', categoriesRoutes);

app.use('/api', productsRoutes);

app.use('/api', stockRoutes);

app.use('/api', productOptionsRoutes);

app.use('/api/auth', cartRoutes);

app.use('/api/auth', orderRoutes);

const PORT = process.env.PORT;

async function warmUpDB() {
  try { 
    await pool.query('SELECT 1'); 
    // console.log('Database pool is warm and ready!'); 
  } catch (err) { 
    console.error('❌ DB warm-up failed:', err); 
  } 
}

app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
  warmUpDB();
});

module.exports = app;