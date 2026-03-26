// Standardized Response Format
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error') => {
    return res.status(statusCode).json({
        success: false,
        message,
        data: null
    });
};

module.exports = { sendSuccess, sendError };
