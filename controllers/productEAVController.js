const ProductEAV = require('../models/ProductEAV');
const productEAV = require('../models/ProductEAV');

const isClothesCategory = (categories) => {
  if (!categories) return false;
  const clothesKeywords = ['clothes', 'dress', 'shirt', 'jeans', 't-shirt', 'dresses', 't-shirts'];
  return clothesKeywords.some(keyword => 
    categories.toLowerCase().includes(keyword.toLowerCase())
  );
};

const formatProduct = (product) => {
  const baseProduct = {
    id: product.entity_id,
    name: product.name,
    price: `$${parseFloat(product.price || 0).toFixed(2)}`,
    image: product.image_path,
    description: product.description,
    seller_id: product.seller_id,
    seller_name: product.seller_name,
    sku: product.sku,
    status: product.status,
    categories: product.categories
  };
  return baseProduct;
};

exports.getAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    try {
        const result = await productEAV.findAll(page, limit);
        const formattedProducts = result.data.map(product => formatProduct(product));
        
        res.json({
            success: true,
            data: formattedProducts,
            pagination: result.pagination
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productEAV.findById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const formattedProduct = formatProduct(product);
        
        res.json({
            success: true,
            data: formattedProduct
        });
    } catch (error) {
        console.log('Error: ', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
};

exports.getProductsBySellerId = async (req, res) => {
    try {
        const { id: sellerId } = req.params;
        
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
        
        const formattedProducts = products.map(product => formatProduct(product));
        
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
        const { 
            name, 
            price, 
            image, 
            description, 
            category, 
            status = 1, 
            sellerId,
            size,
            color
        } = req.body;

        
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

        const isClothes = category && (
            category.toLowerCase().includes('clothes') || 
            category.toLowerCase().includes('dress') || 
            category.toLowerCase().includes('shirt') || 
            category.toLowerCase().includes('jeans')
        );

        if (isClothes) {
            if (!size || size.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Size is required for clothing products'
                });
            }
            
            if (!color || color.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Color is required for clothing products'
                });
            }
        }

        const productData = {
            sku: `PROD-${Date.now()}`,   
            name,
            price: parseFloat(price),
            image_path: image,           
            description,
            category,
            status: parseInt(status),
            seller_id: parseInt(sellerId)
        };

        if (isClothes) {
            productData.size = size;
            productData.color = color;
        }

        const entityId = await ProductEAV.create(productData);
        
        const responseData = { ...productData, id: entityId };
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: responseData
        });
        console.log('Create: ', productData);
        
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
        const { 
            name, 
            price, 
            image, 
            description, 
            category, 
            status, 
            sellerId,
            size,
            color
        } = req.body;        

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

        const isClothes = category && (
            category.toLowerCase().includes('clothes') || 
            category.toLowerCase().includes('dress') || 
            category.toLowerCase().includes('shirt') || 
            category.toLowerCase().includes('jeans')
        ) || isClothesCategory(existingProduct.categories);

        if (isClothes) {
            if (size !== undefined && (!size || size.trim() === '')) {
                return res.status(400).json({
                    success: false,
                    message: 'Size is required for clothing products'
                });
            }
            
            if (color !== undefined && (!color || color.trim() === '')) {
                return res.status(400).json({
                    success: false,
                    message: 'Color is required for clothing products'
                });
            }
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

        if (isClothes) {
            if (size !== undefined) productData.size = size;
            if (color !== undefined) productData.color = color;
        }
        
        const result = await ProductEAV.update(id, productData);
        
        if (result) {
            const updatedProduct = await ProductEAV.findById(id);
            const formattedProduct = formatProduct(updatedProduct);
            
            res.status(200).json({
                success: true,
                message: "Product updated successfully",
                data: formattedProduct
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
};

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
};

// Additional method to get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const allProducts = await productEAV.findAll();
        
        const categoryProducts = allProducts
            .filter(product => 
                product.categories && 
                product.categories.toLowerCase().includes(category.toLowerCase())
            )
            .map(product => formatProduct(product));
        
        res.json({
            success: true,
            data: categoryProducts,
            count: categoryProducts.length,
            category: category,
            message: `Products in category '${category}' retrieved successfully`
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products by category',
            error: error.message
        });
    }
}