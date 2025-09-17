const express = require('express');
const router = express.Router();
const productOptionController = require('../controllers/productOptionController')

router.get('/product-options/:id', productOptionController.getAllOption);
router.get('/product-option-values/:id', productOptionController.getValues);

module.exports = router;