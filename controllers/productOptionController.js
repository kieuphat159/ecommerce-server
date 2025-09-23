const ProductOption = require('../models/ProductOption');
const productOption = require('../models/ProductOption')

exports.getAllOptionsWithStock = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await productOption.getOptionsWithStock(id);
    const optionsMap = {};
    rows.forEach(row => {
      if (!optionsMap[row.option_id]) {
        optionsMap[row.option_id] = {
          id: row.option_id,
          name: row.option_name,
          values: []
        };
      }
      optionsMap[row.option_id].values.push({
        id: row.value_id,
        value: row.option_value,
        quantity: parseInt(row.total_quantity, 10) || 0
      });
    });

    res.json({
      success: true,
      data: Object.values(optionsMap)
    });
  } catch (err) {
    console.log('Err: ', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching options with stock',
      error: err.message
    });
  }
};


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

exports.createOption = async (req, res) => {
  try {
    const { product_id, code, name } = req.body;
    if (!product_id || !name) {
      return res.status(400).json({ success: false, message: 'Missing product_id or name' });
    }
    const option = await ProductOption.create(product_id, code || name.toLowerCase(), name);
    res.json({ success: true, data: option });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating option', error: err.message });
  }
};

exports.createOptionValue = async (req, res) => {
  console.log('ok');
  try {
    const { option_id, value } = req.body;
    if (!option_id || !value) {
      return res.status(400).json({ success: false, message: 'Missing option_id or value' });
    }
    const query = `
      INSERT INTO product_option_value (option_id, value)
      VALUES (?, ?)
    `;
    const [result] = await ProductOption.db.execute(query, [option_id, value]);
    res.json({
      success: true,
      data: { id: result.insertId, value }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating option value', error: err.message });
    console.log('Err: ', err);
  }
};

exports.getVariantIdByOptions = async (req, res) => {
  try {
    const { product_id, options } = req.body;
    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Missing product_id' });
    }
    const variantId = await ProductOption.getVariantIdByOptions(product_id, options);
    res.json({ success: true, variantId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error getting variantId', error: err.message });
  }
};