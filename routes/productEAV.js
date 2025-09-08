const express = require('express');
const router = express.Router();
const productEAVController = require('../controllers/productEAVController');
// const upload = require('../config/upload');
// const authMiddleware = require('../middleware/auth');

router.get('/products', productEAVController.getAllProducts);

router.get('/:id', productEAVController.getProductById);

/*
router.post('/',
  authMiddleware,
  upload.single('image'),
  productEAVController.createProduct
);
*/

module.exports = router;