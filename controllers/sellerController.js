exports.getSellerPage = (req, res) => {
    try {
        res.status(200).json({ 
            message: 'Welcome to the Seller Page',
            userId: req.user.userId,
            role: req.user.role 
        });
    } catch (error) {
        console.error('Error in getSellerPage:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}