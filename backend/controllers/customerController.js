const { sendSuccess, sendError } = require('../utils/response');

const createCustomer = async (req, res, next) => {
    const { name, email, phone, address } = req.body;
    if (!name || !email) return sendError(res, 400, 'Name and email are required');

    try {
        const result = await req.db.run(
            'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
            [name, email, phone, address]
        );
        sendSuccess(res, { id: result.lastID, name, email }, 'Customer created successfully', 201);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return sendError(res, 400, 'Email already registered');
        }
        next(err);
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const customers = await req.db.all('SELECT * FROM customers ORDER BY created_at DESC');
        sendSuccess(res, customers, 'Customers retrieved successfully');
    } catch (err) {
        next(err);
    }
};

const getCustomerDetails = async (req, res, next) => {
    const { id } = req.params;
    try {
        const customer = await req.db.get('SELECT * FROM customers WHERE id = ?', [id]);
        if (!customer) return sendError(res, 404, 'Customer not found');

        // Fetch their order history
        const orders = await req.db.all('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [id]);
        
        // Calculate total spending
        const totalSpending = orders.reduce((sum, order) => sum + order.total, 0);

        sendSuccess(res, { ...customer, total_spending: totalSpending, orders }, 'Customer details retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = { createCustomer, getCustomers, getCustomerDetails };
