const express = require('express');
const router = express.Router();
const productOptionController = require('../controllers/productOptionController')

router.get('/product-default-quantity/:entityId', productOptionController.getDefaultQuantity);
router.get('/seller/product-options/:id', productOptionController.getAllOption);
router.get('/product-options/:id', productOptionController.getAllOptionsWithStock);
router.get('/product-option-values/:id', productOptionController.getValues);
router.get('/product-variant/:variantId', productOptionController.getVariantDetails);
router.post('/product-options', productOptionController.createOption);
router.post('/product-option-values', productOptionController.createOptionValue);
router.post('/product-variant-id', productOptionController.getVariantIdByOptions);

module.exports = router;