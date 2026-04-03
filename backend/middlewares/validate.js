const Joi = require('joi');

// Schémas de validation
const schemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(30).required()
      .messages({ 'string.empty': 'Le nom d\'utilisateur est requis.' }),
    password: Joi.string().min(6).required()
      .messages({ 'string.empty': 'Le mot de passe est requis.' }),
  }),

  register: Joi.object({
    username: Joi.string().min(3).max(30).required()
      .messages({ 'string.empty': 'Le nom d\'utilisateur est requis.' }),
    email: Joi.string().email().required()
      .messages({ 'string.email': 'L\'email doit être valide.' }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 6 caractères.',
        'string.empty': 'Le mot de passe est requis.',
      }),
  }),

  createOrder: Joi.object({
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().required(),
      })
    ).min(1).required()
      .messages({ 'array.min': 'La commande doit contenir au moins un produit.' }),
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
    }).required(),
    paymentMethod: Joi.string().valid('Carte bancaire', 'PayPal', 'Virement').required(),
    shippingMethod: Joi.string().valid('colissimo', 'chronopost').required(),
    total: Joi.number().positive().optional(),
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string().valid('En attente', 'En cours de traitement', 'Expédiée', 'Délivrée', 'Annulée').required()
      .messages({ 'any.only': 'Le statut fourni n\'est pas valide.' }),
  }),

  updateStock: Joi.object({
    stock: Joi.number().integer().min(0).required()
      .messages({ 'number.min': 'Le stock ne peut pas être négatif.' }),
  }),
};

// Middleware de validation
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next();

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({ message: 'Données invalides', errors: messages });
    }
    next();
  };
};

module.exports = { validate, schemas };
