const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    let token = req.header('Authorization');
    
    if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
    } else {
        // Fallback to x-auth-token if Authorization is missing or not Bearer
        token = req.header('x-auth-token');
    }
    
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = auth;
