const category = require('../models/Category');

const formatCategory = (category) => {
    const baseCategory = {
        id: category.category_id,
        name: category.name
    }

    return baseCategory;
}

exports.getAllCategory = async (req, res) => {
    try {
        const categories = await category.findAll();
        const formattedCategories = categories.map(category => formatCategory(category));

        res.json({
            success: true,
            data: formattedCategories
        });
    } catch (err) {
        console.log('Error: ', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: err.message
        })
    }
}