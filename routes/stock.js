const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController')

router.get('/seller/stocks', stockController.getAllStocks);

module.exports = router;