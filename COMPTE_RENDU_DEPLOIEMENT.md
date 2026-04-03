# Compte rendu - Préparation au déploiement

**Date :** 03/04/2026  
**Objectif :** Préparer l'application pour un déploiement en production (Backend + Gateway + Microservices sur Render, Frontend sur Vercel)

---

## Architecture du projet

```
Examen blanc/
├── frontend/          → Vercel
├── backend/           → Render (Web Service)
├── gateway/           → Render (Web Service)
└── microservices/
    ├── notifications/       → Render (Web Service)
    └── stock-management/    → Render (Web Service)
```

---

## Modifications effectuées

### 1. Backend (`backend/`)

| Fichier | Modification | Raison |
|---|---|---|
| `package.json` | Script start : `nodemon server.js` → `node server.js` | `nodemon` est un outil de développement, Render utilise `npm start` avec `node` en production |
| `config/db.js` | Suppression du `console.log` qui affichait `process.env.MONGO_URI` | Fuite de la chaîne de connexion MongoDB dans les logs (risque de sécurité) |
| `config/db.js` | Suppression des options `useNewUrlParser` et `useUnifiedTopology` | Options dépréciées depuis Mongoose 6+, plus nécessaires |

### 2. Gateway (`gateway/`)

| Fichier | Modification | Raison |
|---|---|---|
| `package.json` | Script start : `nodemon server.js` → `node server.js` | Même raison que le backend |
| `package.json` | Ajout de la dépendance `cors` | Nécessaire pour autoriser les requêtes cross-origin depuis le frontend Vercel |
| `server.js` | Ajout du middleware `cors()` | Permettre au frontend (domaine Vercel) d'appeler le gateway (domaine Render) |
| `server.js` | `process.env.GATEWAY_PORT` → `process.env.PORT` | Render injecte automatiquement la variable `PORT`, il faut l'utiliser |

### 3. Microservice Notifications (`microservices/notifications/`)

| Fichier | Modification | Raison |
|---|---|---|
| `package.json` | Ajout du script `"start": "node index.js"` | Render a besoin d'un script start pour lancer le service |
| `index.js` | Suppression du `console.log` qui affichait `EMAIL_USER` et `EMAIL_APPLICATION_PASSWORD` | Fuite des identifiants email dans les logs (risque de sécurité) |
| `index.js` | `process.env.NOTIFI_PORT` → `process.env.PORT` | Render injecte automatiquement `PORT` |

### 4. Microservice Stock Management (`microservices/stock-management/`)

| Fichier | Modification | Raison |
|---|---|---|
| `package.json` | Ajout du script `"start": "node index.js"` | Render a besoin d'un script start pour lancer le service |
| `index.js` | Port hardcodé `4003` → `process.env.PORT \|\| 4003` | Render attribue un port dynamique via la variable `PORT` |

### 5. Frontend (`frontend/`)

| Fichier | Modification | Raison |
|---|---|---|
| `src/services/api.js` | URL `http://localhost:5000/api` → `process.env.REACT_APP_API_URL \|\| 'http://localhost:5000/api'` | Permettre de configurer l'URL du backend via variable d'environnement sur Vercel |
| `src/services/adminApi.js` | Même modification | Idem |
| `src/pages/Login.js` | URL en dur remplacée par la variable d'environnement | Idem |
| `src/pages/Register.js` | URL en dur remplacée par la variable d'environnement | Idem |

---

## Configuration requise sur Render

### Service : Backend
- **Root Directory :** `backend`
- **Build Command :** `npm install`
- **Start Command :** `npm start`
- **Variables d'environnement :**
  - `MONGO_URI` — Chaîne de connexion MongoDB Atlas
  - `JWT_SECRET` — Clé secrète pour les tokens JWT
  - `PORT` — Géré automatiquement par Render

### Service : Gateway
- **Root Directory :** `gateway`
- **Build Command :** `npm install`
- **Start Command :** `npm start`
- **Variables d'environnement :**
  - `NOTIFI_SERVICE_URL` — URL Render du service notifications (ex: `https://notifications-xxxx.onrender.com`)
  - `STOCK_SERVICE_URL` — URL Render du service stock-management (ex: `https://stock-xxxx.onrender.com`)

### Service : Notifications
- **Root Directory :** `microservices/notifications`
- **Build Command :** `npm install`
- **Start Command :** `npm start`
- **Variables d'environnement :**
  - `EMAIL_USER` — Adresse Gmail
  - `EMAIL_APPLICATION_PASSWORD` — Mot de passe d'application Gmail

### Service : Stock Management
- **Root Directory :** `microservices/stock-management`
- **Build Command :** `npm install`
- **Start Command :** `npm start`

---

## Configuration requise sur Vercel

- **Root Directory :** `frontend`
- **Framework :** Create React App (détecté automatiquement)
- **Variables d'environnement :**
  - `REACT_APP_API_URL` — URL du backend sur Render (ex: `https://backend-xxxx.onrender.com/api`)
  - `CI` — Mettre à `false` pour éviter que les warnings ESLint bloquent le build

> **Note :** `REACT_APP_API_URL` est injectée au build time. Tout changement de cette variable nécessite un redéploiement du frontend.

---

## Remarques

- Le microservice `auth-gateway` (`microservices/auth-gateway/`) n'a pas été configuré car son code est vide et la route correspondante est commentée dans le gateway.
- Les fichiers `.env` ne doivent jamais être commités (le `.gitignore` existant les exclut déjà). Toutes les variables sensibles doivent être configurées directement dans les dashboards Render et Vercel.
- En local, les fallbacks (`localhost:5000`, port `4002`, etc.) permettent de continuer à développer sans configurer de variables d'environnement.
