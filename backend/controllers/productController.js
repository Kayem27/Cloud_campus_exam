const Product = require('../models/Product');
const logger = require('../config/logger');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    logger.error('Erreur lors de la récupération des produits', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

exports.updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }

    product.stock = stock;
    product.updatedAt = Date.now();
    await product.save();

    res.json({ message: 'Stock mis à jour avec succès.', product });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du stock', { error: error.message });
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
