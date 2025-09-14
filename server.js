const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload')
const productsRoutes = require('./routes/productEAV')
const categoriesRoutes = require('./routes/category')

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

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;