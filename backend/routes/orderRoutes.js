const express = require('express');
const { createOrder, deleteOrder, getOrders, validateOrder, updateOrderStatus } = require('../controllers/orderController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.get('/', authenticateToken, isAdmin, getOrders);
router.post('/', authenticateToken, validate('createOrder'), createOrder);
router.delete('/:id', authenticateToken, isAdmin, deleteOrder);
router.put('/:id/validate', authenticateToken, isAdmin, validateOrder);
router.put('/:orderId/status', authenticateToken, isAdmin, validate('updateOrderStatus'), updateOrderStatus);

module.exports = router;
