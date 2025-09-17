const ProductOption = require('../models/ProductOption');
const productOption = require('../models/ProductOption')

const formatOption = (option) => ({
    id: option.option_id,
    name: option.name
});


exports.getAllOption = async (req, res) => {
    try {
        const { id } = req.params;
        const options = await productOption.getAllOption(id);
        const formattedOptions = options[0].map(option => formatOption(option));

        res.json({
            success: true,
            data: formattedOptions
        })
    } catch (err) {
        console.log('Err: ', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching options',
            error: err.message
        })
    }
}

exports.getValues = async (req, res) => {
    try {
        const { id } = req.params;
        const values = await ProductOption.getValues(id);
        const formattedValues = values.map(value => ({
            id: value.value_id,
            value: value.value
        }))

        res.json({
            success: true,
            data: formattedValues
        })
    } catch (err) {
        console.log('Err: ', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching option values',
            error: err.message
        })
    }
}