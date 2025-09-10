const express = require('express');
const router = express.Router();
const productEAVController = require('../controllers/productEAVController');
const upload = require('../middleware/multerMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/products', productEAVController.getAllProducts);

router.get('/:id', productEAVController.getProductById);

router.get('/products:id', 
  //authMiddleware.authenticateToken,
  productEAVController.getProductsBySellerId);

router.post('/create',
  upload.single('image'),
  productEAVController.createProduct
);

module.exports = router;