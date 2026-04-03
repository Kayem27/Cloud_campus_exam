const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('./logger');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB connecté');
    } catch (err) {
        logger.error('Erreur connexion MongoDB', { error: err.message });
        process.exit(1);
    }
};

module.exports = connectDB;
