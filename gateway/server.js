// gateway/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
//const authProxy = require('./routes/auth');
const notifiProxy = require('./routes/notifi');
const stockProxy = require('./routes/stock');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes principales pour chaque microservice
//app.use('/auth', authProxy);
app.use('/notify', notifiProxy);
app.use('/update-stock', stockProxy);

// Lancer le Gateway
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Gateway opérationnel sur le port ${PORT}`);
});