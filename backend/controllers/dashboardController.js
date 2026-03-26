const { sendSuccess, sendError } = require('../utils/response');

const getStats = async (req, res, next) => {
    try {
        const prodCount = await req.db.get('SELECT COUNT(*) as count FROM products');
        const invValueRow = await req.db.get('SELECT SUM(price * stock) as val FROM products');
        const inventoryValue = '$' + (invValueRow.val || 0).toFixed(2);
        
        const lowStockRow = await req.db.get('SELECT COUNT(*) as count FROM products WHERE stock < 10 AND stock > 0');
        const outOfStockRow = await req.db.get('SELECT COUNT(*) as count FROM products WHERE stock = 0');

        // Graph 1: Monthly Orders (Fill missing months)
        const orderRows = await req.db.all(`
            SELECT strftime('%m', created_at) as month, COUNT(*) as count 
            FROM orders 
            GROUP BY month 
            ORDER BY month ASC
        `);
        
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        let monthlyOrders = monthNames.map(name => ({ name, count: 0 }));
        orderRows.forEach(row => {
            if (row.month) {
                const index = parseInt(row.month, 10) - 1;
                monthlyOrders[index].count = row.count;
            }
        });

        // Graph 2: Top Products
        const topProducts = await req.db.all(`
            SELECT p.name as name, COALESCE(SUM(oi.quantity), 0) as sales
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            GROUP BY p.id
            ORDER BY sales DESC
            LIMIT 5
        `);

        // Graph 3: Category Distribution
        const categoryDistribution = await req.db.all(`
            SELECT COALESCE(c.name, 'Uncategorized') as name, COUNT(p.id) as value
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            GROUP BY p.category_id
        `);

        // Graph 4: Stock Status Array
        const inStock = prodCount.count - lowStockRow.count - outOfStockRow.count;
        const stockStatus = [
            { name: 'Available', count: inStock >= 0 ? inStock : 0 },
            { name: 'Low Stock', count: lowStockRow.count },
            { name: 'Out of Stock', count: outOfStockRow.count }
        ];

        sendSuccess(res, {
            inventoryValue: inventoryValue,
            totalProducts: prodCount.count.toString(),
            lowStock: lowStockRow.count.toString(),
            outOfStock: outOfStockRow.count.toString(),
            monthlyOrders,
            topProducts,
            categoryDistribution,
            stockStatus
        }, 'Dashboard stats');
    } catch (err) {
        next(err);
    }
};

module.exports = { getStats };
