const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.get('/', orderController.getOrders); // getOrders checks role natively
router.post('/', checkRole(['admin', 'staff', 'customer']), orderController.createOrder);
router.put('/:id/status', checkRole(['admin', 'staff']), orderController.updateOrderStatus);
router.get('/:id/items', orderController.getOrderItems);

module.exports = router;
