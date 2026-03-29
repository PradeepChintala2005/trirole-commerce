const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Categories
// Public route for viewing categories
router.get('/categories', productController.getCategories);
router.post('/categories', authMiddleware, checkRole(['admin', 'staff']), productController.createCategory);

// Products
// Public route for viewing inventory
router.get('/', productController.getProducts);  
router.post('/', authMiddleware, checkRole(['admin', 'staff']), productController.createProduct);
router.put('/:id', authMiddleware, checkRole(['admin', 'staff']), productController.updateProduct);
router.delete('/:id', authMiddleware, checkRole(['admin']), productController.deleteProduct);

// History
router.get('/history', authMiddleware, checkRole(['admin']), productController.getStockHistory);

module.exports = router;
