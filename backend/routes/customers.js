const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All customer routes require authentication
router.use(authMiddleware);

// Only admins can see full customer list (example role boundary) or both can; let's allow both
router.get('/', customerController.getCustomers);
router.post('/', checkRole(['admin', 'staff']), customerController.createCustomer);
router.get('/:id', customerController.getCustomerDetails);

module.exports = router;
