const express = require('express');
const router = express.Router();
const productEAVController = require('../controllers/productEAVController');
const upload = require('../middleware/multerMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/products', productEAVController.getProducts);

router.get('/seller/product/:id',
  productEAVController.getProductById
);

router.put('/seller/product/:id',
  productEAVController.updateProduct
);

router.delete('/seller/product/:id',
  productEAVController.deleteProduct
);

router.get('/product/:id', productEAVController.getProductById);

router.post('/create',
  upload.single('image'),
  productEAVController.createProduct
);

router.get('/seller/products/:id', productEAVController.getProductsBySellerId);

router.get('/seller/bestsellers', productEAVController.getBestSellers)

module.exports = router;