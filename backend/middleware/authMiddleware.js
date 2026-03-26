const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const JWT_SECRET = 'enterprise-secret-change-me';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return sendError(res, 401, 'Access Denied: No Token Provided!');

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; 
        // req.user will contain { id, username, role }
        next();
    } catch (err) {
        return sendError(res, 403, 'Invalid or Expired Token');
    }
};

const generateToken = (user) => {
    return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
};

module.exports = { authMiddleware, generateToken };
