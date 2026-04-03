const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');
const logger = require('../config/logger');

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    logger.error('Erreur lors de la récupération des commandes', { error: error.message });
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await Order.findByIdAndUpdate(id, { status });
    try {
      await axios.post(`${process.env.GATEWAY_URL || 'http://localhost:8000'}/notify`, {
        to: 'syaob@yahoo.fr',
        subject: 'Mise à jour de commande',
        text: `Le statut de la commande ${id} a été mis à jour en "${status}".`,
      });
    } catch (notifError) {
      logger.error('Erreur notification', { error: notifError.message });
    }
    res.json({ message: `Statut de la commande ${id} mis à jour` });
  } catch (error) {
    logger.error('Erreur mise à jour statut commande', { error: error.message });
    res.status(500).json({ message: 'Erreur de mise à jour du statut de la commande' });
  }
};

exports.validateOrder = async (req, res) => {
  const { id } = req.params;

  try {
    await Order.findByIdAndUpdate(id, { status: 'Délivrée' });
    try {
      await axios.post(`${process.env.GATEWAY_URL || 'http://localhost:8000'}/notify`, {
        to: 'abdoulatuf.pro@gmail.com',
        subject: 'Commande validée',
        text: `La commande ${id} a été validée.`,
      });
    } catch (notifError) {
      logger.error('Erreur notification', { error: notifError.message });
    }
    res.json({ message: `Commande ${id} validée` });
  } catch (error) {
    logger.error('Erreur validation commande', { error: error.message });
    res.status(500).json({ message: 'Erreur lors de la validation de la commande' });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    logger.error('Erreur récupération produits', { error: error.message });
    res.status(500).json({ message: 'Erreur lors de la récupération des produits' });
  }
};

exports.updateProductStock = async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  try {
    await Product.findByIdAndUpdate(id, { stock });
    try {
      await axios.post(`${process.env.GATEWAY_URL || 'http://localhost:8000'}/notify`, {
        to: 'abdoulatuf.pro@gmail.com',
        subject: 'Mise à jour stock',
        text: `Le stock du produit ${id} a été mis à jour à ${stock}.`,
      });
    } catch (notifError) {
      logger.error('Erreur notification', { error: notifError.message });
    }
    res.json({ message: `Stock du produit ${id} mis à jour` });
  } catch (error) {
    logger.error('Erreur mise à jour stock', { error: error.message });
    res.status(500).json({ message: 'Erreur lors de la mise à jour du stock du produit' });
  }
};
