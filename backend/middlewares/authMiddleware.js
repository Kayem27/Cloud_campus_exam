const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

exports.authenticateToken = (req, res, next) => {
  // Lire le token depuis le cookie HTTPOnly (prioritaire) ou le header Authorization (fallback)
  const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentification requise.' });

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    logger.warn('Token invalide ou expiré');
    return res.status(403).json({ message: 'Token invalide ou expiré.' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès interdit' });
  next();
};
