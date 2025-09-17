const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController')

router.get('/seller/stocks', stockController.getAllStocks);
router.get('/stock/:variantId', stockController.getStockQuantity);
router.post('/stock/update', stockController.updateStockQuantity);
router.post('/stock/add', stockController.addStockQuantity);


module.exports = router;