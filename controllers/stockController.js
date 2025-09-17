const stock = require('../models/Stock')

const formatStock = (stock) => {
    const baseStock = {
        id: stock.stock_id,
        name: stock.stock_name
    }
    return baseStock;
}

exports.getAllStocks = async (req, res) => {
    try {
        const stocks = await stock.getAllStocks();
        const formattedStocks = stocks.map(stock => formatStock(stock))

        res.json({
            success: true,
            data: formattedStocks
        })
    } catch (err) {
        console.log('Err: ', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching stocks',
            error: err.message
        })
    }
}

exports.getStockQuantity = async (req, res) => {
  try {
    const { variantId } = req.params;
    const stockId = req.query.stockId ? parseInt(req.query.stockId) : null;
    const stockData = await stock.getStockQuantity(variantId, stockId);
    res.json({ success: true, data: stockData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching stock quantity', error: err.message });
  }
};

exports.updateStockQuantity = async (req, res) => {
  try {
    const { variantId, stockId, quantity } = req.body;
    if (!variantId || !stockId || quantity == null) {
      return res.status(400).json({ success: false, message: 'Missing variantId, stockId, or quantity' });
    }
    const result = await stock.updateStockQuantity(variantId, stockId, quantity);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating stock quantity', error: err.message });
  }
};

exports.addStockQuantity = async (req, res) => {
    try {
        const { entityId, stockId, quantity, options } = req.body;

        if (!entityId || !stockId || !quantity) {
            return res.status(400).json({ success: false, message: 'Missing entityId, stockId or quantity' });
        }

        const result = await stock.addStockQuantity(entityId, stockId, quantity, options || {});

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding stock quantity', error: err.message });
    }
};