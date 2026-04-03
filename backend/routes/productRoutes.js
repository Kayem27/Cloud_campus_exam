const express = require('express');
const { getProducts, updateProductStock } = require('../controllers/productController');
const { authenticateToken, isAdmin } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.get('/', getProducts);
router.put('/:productId/stock', authenticateToken, isAdmin, validate('updateStock'), updateProductStock);

module.exports = router;
