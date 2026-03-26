const { sendError } = require('../utils/response');

// Middleware to check if user has the correct role
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return sendError(res, 403, 'Permission Denied: No Role Assigned');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return sendError(res, 403, `Permission Denied: Requires one of [${allowedRoles.join(', ')}]`);
        }

        next();
    };
};

module.exports = { checkRole };
