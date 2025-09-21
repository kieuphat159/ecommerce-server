const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    // lay token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token is required' });
    }

    // xac thuc token
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// middleware kiem tra role seller
const requireSellerRole = (req, res, next) => {
    //console.log('User role:', req.user.role);
    if (req.user.role !== 'seller') {
        return res.status(403).json({ message: 'Access denied: Seller role required' });
    }
    next();
}

const requireCustomerRole = (req, res, next) => {
    //console.log('User role: ', req.user.role);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token is required' });
    }
    //console.log('User role:', req.user.role);
    if (req.user.role !== 'customer') {
        return res.status(403).json({ message: 'Access denied!' });
    }
    next();
}

module.exports = {
    authenticateToken,
    requireSellerRole,
    requireCustomerRole
};