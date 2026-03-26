const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

router.post('/register', authController.register);  // Public Storefront Registration
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

// Admin User Management Routes
router.get('/users', authMiddleware, checkRole(['admin']), authController.getUsers);
router.post('/users', authMiddleware, checkRole(['admin']), authController.createUser);
router.delete('/users/:id', authMiddleware, checkRole(['admin']), authController.deleteUser);

module.exports = router;
