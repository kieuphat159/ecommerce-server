const express = require('express');
const router = express.Router();
const productEAVController = require('../controllers/productEAVController');
const upload = require('../middleware/multerMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/products', productEAVController.getAllProducts);

router.get('/products/:category', productEAVController.getProductsByCategory);

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

router.get('/seller/products/:id', 
  //authMiddleware.authenticateToken,
  productEAVController.getProductsBySellerId);

module.exports = router;