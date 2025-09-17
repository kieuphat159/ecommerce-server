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
        console('Err: ', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching stocks',
            error: err.message
        })
    }
}