const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./config/db');
const logger = require('./config/logger');

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();
connectDB();

// CORS — autoriser les cookies cross-origin
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
logger.info(`CORS origin configuré : ${allowedOrigin}`);
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// Sécurité des headers HTTP (après CORS pour ne pas interférer)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cookieParser());
app.use(express.json());

// Rate limiting sur les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  message: { message: 'Trop de tentatives, veuillez réessayer dans 15 minutes.' },
});
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// Gestion globale des erreurs non gérées
app.use((err, req, res, next) => {
  logger.error('Erreur non gérée', { error: err.message, stack: err.stack });
  res.status(500).json({ message: 'Erreur interne du serveur.' });
});

// Capture des rejections et exceptions non gérées
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Serveur en écoute sur le port ${PORT}`));
