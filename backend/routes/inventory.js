const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Categories
router.get('/categories', productController.getCategories);
router.post('/categories', checkRole(['admin', 'staff']), productController.createCategory);

// Products
router.get('/', productController.getProducts);  // Public/All auth'd allowed
router.post('/', checkRole(['admin', 'staff']), productController.createProduct);
router.put('/:id', checkRole(['admin', 'staff']), productController.updateProduct);
router.delete('/:id', checkRole(['admin']), productController.deleteProduct);

// History
router.get('/history', checkRole(['admin']), productController.getStockHistory);

module.exports = router;
