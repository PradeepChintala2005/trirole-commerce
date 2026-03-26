const { sendSuccess, sendError } = require('../utils/response');

const createOrder = async (req, res, next) => {
    let { customer_id, items } = req.body; // items = [{ product_id, quantity }]
    
    // Auto-detect customer_id for storefront Customers
    if (req.user.role === 'customer') {
        const customer = await req.db.get('SELECT id FROM customers WHERE user_id = ?', [req.user.id]);
        if (!customer) return sendError(res, 404, 'Customer profile not found for this user account');
        customer_id = customer.id;
    }

    if (!customer_id || !items || !items.length) {
        return sendError(res, 400, 'Customer ID and Items are required');
    }

    try {
        await req.db.exec('BEGIN TRANSACTION');

        let total = 0;
        const validItems = [];

        for (const item of items) {
            const product = await req.db.get('SELECT price, stock FROM products WHERE id = ?', [item.product_id]);
            if (!product) throw new Error(`Product ID ${item.product_id} not found`);
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for Product ID ${item.product_id}`);

            total += product.price * item.quantity;
            validItems.push({
                product_id: item.product_id,
                price: product.price,
                quantity: item.quantity
            });

            await req.db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);

            await req.db.run(
                'INSERT INTO stock_history (product_id, user_id, change_amount, action_type) VALUES (?, ?, ?, ?)',
                [item.product_id, req.user.id, -item.quantity, 'remove']
            );
        }

        const orderResult = await req.db.run(
            "INSERT INTO orders (customer_id, status, total) VALUES (?, 'pending', ?)",
            [customer_id, total]
        );
        const orderId = orderResult.lastID;

        for (const item of validItems) {
            await req.db.run(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await req.db.exec('COMMIT');
        return sendSuccess(res, { orderId, total }, 'Order created successfully and stock updated', 201);
    } catch (err) {
        await req.db.exec('ROLLBACK');
        if (err.message.includes('Insufficient stock') || err.message.includes('not found')) {
            return sendError(res, 400, err.message);
        }
        next(err);
    }
};

const getOrders = async (req, res, next) => {
    try {
        let query = `
            SELECT o.*, c.name as customer_name, c.email as customer_email
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
        `;
        let params = [];

        // Isolate Customer Orders
        if (req.user.role === 'customer') {
            const customer = await req.db.get('SELECT id FROM customers WHERE user_id = ?', [req.user.id]);
            if (!customer) return sendSuccess(res, [], 'No orders found');
            query += ' WHERE o.customer_id = ?';
            params.push(customer.id);
        }

        query += ' ORDER BY o.created_at DESC';

        const orders = await req.db.all(query, params);
        sendSuccess(res, orders, 'Orders fetched');
    } catch (err) {
        next(err);
    }
};

const updateOrderStatus = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'shipped', 'delivered'].includes(status)) {
        return sendError(res, 400, "Status must be 'pending', 'shipped', or 'delivered'");
    }

    try {
        const result = await req.db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        if (result.changes === 0) return sendError(res, 404, 'Order not found');
        sendSuccess(res, { id, status }, 'Order status updated');
    } catch (err) {
        next(err);
    }
};

const getOrderItems = async (req, res, next) => {
    const { id } = req.params;
    try {
        const items = await req.db.all(`
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);
        sendSuccess(res, items, 'Order line items fetched');
    } catch (err) {
        next(err);
    }
}

module.exports = { createOrder, getOrders, updateOrderStatus, getOrderItems };
