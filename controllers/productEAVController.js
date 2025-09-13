const ProductEAV = require('../models/ProductEAV');
const productEAV = require('../models/ProductEAV')

exports.getAllProducts = async (req, res) => {
    try {
        const products = await productEAV.findAll();
        const formattedProducts = products.map(product => ({
            id: product.entity_id,
            name: product.name,
            price: `$${parseFloat(product.price).toFixed(2)}`,
            image: product.image_path,
            description: product.description,
            seller: product.seller_id,
            sku: product.sku,
            status: product.status
        }))
        res.json({
            success: true,
            data: formattedProducts,
            count: formattedProducts.length
        })
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({
            success: false,
            message: 'Error'
        })
    }
}

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productEAV.findById(id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found'
            })
        }
        const formattedProduct = {
            id: product.entity_id,
            name: product.name,
            price: `$${parseFloat(product.price).toFixed(2)}`,
            image: product.image_path,
            description: product.description,
            seller: product.seller_id,
            sku: product.sku,
            status: product.status
        }
        res.json({
            success: true,
            data: formattedProduct
        })
    } catch (err) {
        console.log('Error: ', error);
        res.status(500).json({
            success: false,
            message: 'Error'
        })
    }
}

exports.getProductsBySellerId = async (req, res) => {
  try {
    const { id: sellerId } = req.params;
    
    // Validate sellerId
    if (!sellerId || isNaN(parseInt(sellerId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid seller ID is required'
      });
    }
    
    const products = await productEAV.findBySellerId(parseInt(sellerId));
    
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this seller',
        data: [],
        count: 0
      });
    }
    
    const formattedProducts = products.map(product => ({
      id: product.entity_id,
      sku: product.sku,
      name: product.name,
      price: `$${parseFloat(product.price || 0).toFixed(2)}`,
      image: product.image_path,
      description: product.description,
      seller_id: product.seller_id,
      seller_name: product.seller_name,
      status: product.status
    }));
    
    res.json({
      success: true,
      message: `Found ${formattedProducts.length} products for seller`,
      data: formattedProducts,
      count: formattedProducts.length,
      seller_info: {
        seller_id: products[0].seller_id,
        seller_name: products[0].seller_name
      }
    });
    
  } catch (error) {
    console.error('Error fetching products by seller:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
    const connection = await require('../config/database').getConnection();
    try {
        const { name, price, image, description, category, status = 1, sellerId } = req.body;

        const productData = {
            sku: `PROD-${Date.now()}`,   
            name,
            price,
            image_path: image,           
            description,
            category,
            status,
            seller_id: sellerId 
        };

        ProductEAV.create(productData);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: productData
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, image, description, category, status, sellerId } = req.body;        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'Valid product ID is required'
            });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Product name is required'
            });
        }

        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid price is required'
            });
        }

        if (!sellerId || isNaN(parseInt(sellerId))) {
            return res.status(400).json({
                success: false,
                message: 'Valid seller ID is required'
            });
        }    
        
        const existingProduct = await ProductEAV.findById(id);
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        const productData = {
            sku: existingProduct.sku,
            name: name,
            price: parseFloat(price),
            image_path: image,
            description: description,
            category: category,
            status: status !== undefined ? parseInt(status) : existingProduct.status,
            seller_id: parseInt(sellerId)
        };
        
        
        const result = await ProductEAV.update(id, productData);
        
        if (result) {
            res.status(200).json({
                success: true,
                message: "Update successful",
                data: productData
            });
        } else {
            throw new Error('Update failed');
        }
        
    } catch (err) {
        console.error('Update controller error:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: err.message
        });
    }
}

exports.deleteProduct = async (req, res) => {
    console.log('delete');
    try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'Valid product ID is required'
            });
        }
        
        const result = await productEAV.softDelete(parseInt(id));
        
        if (result) {
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } else {
            throw new Error('Failed to delete product');
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}
