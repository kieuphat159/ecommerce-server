const express = require('express');
const router = express.Router();
const productEAVController = require('../controllers/productEAVController');
const upload = require('../middleware/multerMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/products', productEAVController.getAllProducts);

router.get('/:id', productEAVController.getProductById);

router.post('/create',
  //authMiddleware.authenticateToken,
  upload.single('image'),
  productEAVController.createProduct
);

module.exports = router;