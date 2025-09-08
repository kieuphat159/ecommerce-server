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