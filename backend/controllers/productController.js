const { sendSuccess, sendError } = require('../utils/response');

// ======================
// CATEGORY LOGIC
// ======================
const getCategories = async (req, res, next) => {
    try {
        const categories = await req.db.all('SELECT * FROM categories');
        sendSuccess(res, categories, 'Categories fetched');
    } catch (err) { next(err); }
};

const createCategory = async (req, res, next) => {
    const { name } = req.body;
    if (!name) return sendError(res, 400, 'Category name required');
    try {
        const result = await req.db.run('INSERT INTO categories (name) VALUES (?)', [name]);
        sendSuccess(res, { id: result.lastID, name }, 'Category created', 201);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) return sendError(res, 400, 'Category exists');
        next(err);
    }
};

// ======================
// PRODUCT LOGIC
// ======================
const getProducts = async (req, res, next) => {
    try {
        const products = await req.db.all(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `);
        sendSuccess(res, products, 'Products fetched');
    } catch (err) { next(err); }
};

const createProduct = async (req, res, next) => {
    const { name, description, category_id, price, stock, status } = req.body;
    try {
        await req.db.exec('BEGIN TRANSACTION');
        
        const result = await req.db.run(
            'INSERT INTO products (name, description, category_id, price, stock, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description || '', category_id, price, stock, status || 'active']
        );
        
        // Log history
        await req.db.run(
            'INSERT INTO stock_history (product_id, user_id, change_amount, action_type) VALUES (?, ?, ?, ?)',
            [result.lastID, req.user.id, stock, 'add']
        );
        
        await req.db.exec('COMMIT');
        sendSuccess(res, { id: result.lastID }, 'Product created', 201);
    } catch (err) {
        await req.db.exec('ROLLBACK');
        next(err);
    }
};

const updateProduct = async (req, res, next) => {
    const { id } = req.params;
    const { name, description, category_id, price, stock, status, stock_change_amount } = req.body; // e.g. +5 or -2
    try {
        await req.db.exec('BEGIN TRANSACTION');

        const current = await req.db.get('SELECT stock FROM products WHERE id = ?', [id]);
        if (!current) {
            await req.db.exec('ROLLBACK');
            return sendError(res, 404, 'Product not found');
        }

        let newStock = current.stock;
        if (stock_change_amount) {
            newStock += stock_change_amount;
            if (newStock < 0) {
                await req.db.exec('ROLLBACK');
                return sendError(res, 400, 'Cannot reduce stock below zero');
            }
            // Log history
            const actionType = stock_change_amount > 0 ? 'add' : 'remove';
            await req.db.run(
                'INSERT INTO stock_history (product_id, user_id, change_amount, action_type) VALUES (?, ?, ?, ?)',
                [id, req.user.id, stock_change_amount, actionType]
            );
        } else if (stock !== undefined && stock !== current.stock) {
            newStock = stock;
            const diff = stock - current.stock;
            const actionType = 'update';
            await req.db.run(
                'INSERT INTO stock_history (product_id, user_id, change_amount, action_type) VALUES (?, ?, ?, ?)',
                [id, req.user.id, diff, actionType]
            );
        }

        await req.db.run(
            'UPDATE products SET name = COALESCE(?, name), description = COALESCE(?, description), category_id = COALESCE(?, category_id), price = COALESCE(?, price), stock = ?, status = COALESCE(?, status) WHERE id = ?',
            [name, description, category_id, price, newStock, status, id]
        );

        await req.db.exec('COMMIT');
        sendSuccess(res, { id }, 'Product updated');
    } catch (err) {
        await req.db.exec('ROLLBACK');
        next(err);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const result = await req.db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        if (result.changes === 0) return sendError(res, 404, 'Product not found');
        sendSuccess(res, null, 'Product deleted');
    } catch (err) { next(err); }
};

const getStockHistory = async (req, res, next) => {
    try {
        const history = await req.db.all(`
            SELECT h.*, p.name as product_name, u.username as modified_by
            FROM stock_history h
            JOIN products p ON h.product_id = p.id
            JOIN users u ON h.user_id = u.id
            ORDER BY h.created_at DESC
        `);
        sendSuccess(res, history, 'Stock history fetched');
    } catch (err) { next(err); }
};

module.exports = { getCategories, createCategory, getProducts, createProduct, updateProduct, deleteProduct, getStockHistory };
