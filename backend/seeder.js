// backend/seeder.js
require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const Product = require('./models/Product'); // Vérifie bien le chemin

const MONGO_URI = process.env.MONGO_URI;

const products = [
  {
    name: 'Ordinateur Portable',
    price: 1000,
    description: 'Un ordinateur portable performant pour tous vos besoins.',
    stock: 20,
  },
  {
    name: 'Smartphone',
    price: 700,
    description: 'Un smartphone moderne avec un écran OLED.',
    stock: 50,
  },
  {
    name: 'Casque Audio',
    price: 150,
    description: 'Un casque audio sans fil avec réduction de bruit.',
    stock: 30,
  },
  {
    name: 'Tablette',
    price: 400,
    description: 'Une tablette légère et puissante.',
    stock: 25,
  },
  {
    name: 'Clavier Mécanique',
    price: 120,
    description: 'Un clavier mécanique pour les gamers.',
    stock: 15,
  },
];

function assertValidMongoUri(uri) {
  if (!uri) {
    throw new Error('MONGO_URI manquant dans le fichier .env');
  }

  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname?.replace('/', '').trim();

    if (!dbName) {
      throw new Error(
        'Aucun nom de base détecté dans MONGO_URI. Exemple attendu : mongodb+srv://user:pass@cluster.mongodb.net/ma_base?retryWrites=true&w=majority'
      );
    }
  } catch (error) {
    throw new Error(`MONGO_URI invalide : ${error.message}`);
  }
}

async function connectDatabase() {
  assertValidMongoUri(MONGO_URI);

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });

  console.log(`MongoDB connecté pour le seed : ${mongoose.connection.name}`);
}

async function seedProducts() {
  try {
    await connectDatabase();

    await Product.deleteMany({});
    console.log('Anciens produits supprimés');

    await Product.insertMany(products, { ordered: true });
    console.log('Produits insérés avec succès');
  } catch (error) {
    console.error('Erreur lors du seed :');

    if (error?.name === 'ValidationError') {
      for (const field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    try {
      await mongoose.connection.close();
      console.log('Connexion MongoDB fermée');
    } catch (closeError) {
      console.error('Erreur lors de la fermeture de MongoDB :', closeError);
      process.exitCode = 1;
    }
  }
}

seedProducts();