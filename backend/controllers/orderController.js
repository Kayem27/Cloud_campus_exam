const axios = require('axios');
const Order = require('../models/Order');
const logger = require('../config/logger');

exports.createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, shippingMethod } = req.body;
  let userId = req.user.userId;

  try {
    const orderDetails = items.map(({ productId, quantity, price }) => {
      return { productId, quantity, price };
    });

    const total = items.reduce(
      (acc, { price, quantity }) => acc + price * quantity,
      0
    );

    const newOrder = new Order({
      userId,
      items: orderDetails,
      total,
      shippingAddress,
      paymentMethod,
      shippingMethod,
    });

    const savedOrder = await newOrder.save();

    // Appel au micro-service de notification
    try {
      await axios.post(`${process.env.GATEWAY_URL || 'http://localhost:8000'}/notify`, {
        to: 'abdoulatuf.pro@gmail.com',
        subject: 'Nouvelle Commande Créée',
        text: `Une commande a été créée avec succès pour les produits suivants : \n${orderDetails
          .map((item) => `Produit ID : ${item.productId}, Quantité : ${item.quantity}`)
          .join('\n')}`,
      });
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de la notification', { error: error.message });
    }

    res.status(201).json({
      message: 'Commande créée avec succès',
      order: savedOrder,
    });
  } catch (error) {
    logger.error('Erreur lors de la création de la commande', { error: error.message });
    res.status(500).json({
      message: 'Une erreur est survenue lors de la création de la commande.',
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }
    res.json({ message: 'Commande supprimée avec succès.' });
  } catch (error) {
    logger.error('Erreur lors de la suppression de la commande', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    logger.error('Erreur lors de la récupération des commandes', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.validateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(id, { status: 'Délivrée' }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }
    res.status(200).json({ message: `Commande ${id} validée avec succès.`, order });
  } catch (error) {
    logger.error('Erreur lors de la validation de la commande', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    res.status(200).json({ message: 'Statut mis à jour avec succès', order });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la commande', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
