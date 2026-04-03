const express = require('express');
const { login, register, logout, me } = require('../controllers/authController');
const { validate } = require('../middlewares/validate');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', validate('login'), login);
router.post('/register', validate('register'), register);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

module.exports = router;
