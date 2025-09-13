const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload')
const productsRoutes = require('./routes/productEAV')

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // chỉ định origin cụ thể
  credentials: true,               // cho phép gửi cookie
}));
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use('/api', uploadRoutes)

app.use('/api', productsRoutes);

const PORT = process.env.PORT;
//app.listen(PORT, () => {
//  console.log(`Server running on port ${PORT}`);
//});

module.exports = app;