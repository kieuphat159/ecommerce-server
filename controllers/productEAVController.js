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

exports.createProduct = async (req, res) => {
    const connection = await require('../config/database').getConnection(); // Giả sử bạn có file config database
    
    try {
        await connection.beginTransaction();
        
        const { name, price, image, description, category, status = 1, sellerId } = req.body;
        
        if (!name || !price || !sellerId) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and sellerId are required'
            });
        }
        
        // Generate SKU
        const timestamp = Date.now();
        const sku = `PROD-${timestamp}`;
        
        const [productResult] = await connection.execute(
            'INSERT INTO product_entity (entity_type_id, attribute_set_id, sku) VALUES (?, ?, ?)',
            [1, 1, sku] 
        );
        
        const entityId = productResult.insertId;
        
        
        await connection.execute(
            'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 1, name]
        );
        
        await connection.execute(
            'INSERT INTO product_entity_decimal (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 2, parseFloat(price)]
        );
        
        if (image) {
            await connection.execute(
                'INSERT INTO product_entity_varchar (entity_id, attribute_id, value) VALUES (?, ?, ?)',
                [entityId, 3, image]
            );
        }
        
        if (description) {
            await connection.execute(
                'INSERT INTO product_entity_text (entity_id, attribute_id, value) VALUES (?, ?, ?)',
                [entityId, 4, description]
            );
        }
        
        await connection.execute(
            'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 5, parseInt(status)]
        );
        
        await connection.execute(
            'INSERT INTO product_entity_int (entity_id, attribute_id, value) VALUES (?, ?, ?)',
            [entityId, 6, parseInt(sellerId)]
        );
        
        if (category) {
            const [categoryResult] = await connection.execute(
                'SELECT category_id FROM category WHERE name = ? AND is_active = 1',
                [category]
            );
            
            if (categoryResult.length > 0) {
                await connection.execute(
                    'INSERT INTO category_product (category_id, product_id) VALUES (?, ?)',
                    [categoryResult[0].category_id, entityId]
                );
            }
        }
        
        await connection.commit();
        
        const formattedProduct = {
            id: entityId,
            sku: sku,
            name: name,
            price: `$${parseFloat(price).toFixed(2)}`,
            image: image || null,
            description: description || null,
            seller: parseInt(sellerId),
            status: parseInt(status),
            category: category || null
        };
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: formattedProduct
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

exports.getProductWithCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productEAV.findByIdWithCategory(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        const formattedProduct = {
            id: product.entity_id,
            sku: product.sku,
            name: product.name,
            price: `${parseFloat(product.price || 0).toFixed(2)}`,
            image: product.image_path,
            description: product.description,
            seller: product.seller_id,
            seller_name: product.seller_name,
            status: product.status,
            category: product.category_name
        };
        
        res.json({
            success: true,
            data: formattedProduct
        });
        
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product'
        });
    }
};

