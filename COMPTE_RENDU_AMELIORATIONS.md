# Compte rendu - Améliorations qualité du code et bonnes pratiques

**Date :** 03/04/2026  
**Objectif :** Mettre en place les bonnes pratiques de développement (validation, sécurité, logging, qualité de code)

---

## 1. Validation des données avec Joi

**Problème :** Les données envoyées par le client étaient insérées directement dans la base de données sans validation préalable. Un utilisateur pouvait envoyer des données malformées ou incomplètes.

**Solution :** Création d'un middleware de validation centralisé avec Joi.

**Fichier créé :** `backend/middlewares/validate.js`

**Schémas définis :**

| Schéma | Champs validés |
|---|---|
| `login` | `username` (3-30 chars), `password` (min 6 chars) |
| `register` | `username` (3-30 chars), `email` (format email), `password` (min 6 chars) |
| `createOrder` | `items` (tableau non vide avec productId/quantity/price), `shippingAddress` (tous champs requis), `paymentMethod` (enum), `shippingMethod` (enum) |
| `updateOrderStatus` | `status` (enum parmi les statuts autorisés) |
| `updateStock` | `stock` (entier >= 0) |

**Routes modifiées :**
- `POST /api/auth/login` — validation `login`
- `POST /api/auth/register` — validation `register`
- `POST /api/orders` — validation `createOrder`
- `PUT /api/orders/:id/status` — validation `updateOrderStatus`
- `PUT /api/products/:id/stock` — validation `updateStock`

En cas de données invalides, le serveur renvoie un `400` avec les messages d'erreur détaillés au lieu de crasher.

---

## 2. JWT dans un cookie HTTPOnly (au lieu de localStorage)

**Problème :** Le token JWT était stocké dans `localStorage`, exposé aux attaques XSS. Un script malveillant injecté dans la page pouvait voler le token et usurper l'identité de l'utilisateur.

**Solution :** Le token est maintenant envoyé dans un cookie HTTPOnly sécurisé.

### Côté backend

**Fichiers modifiés :**
- `backend/controllers/authController.js` — Le login envoie le token via `res.cookie()` avec les flags :
  - `httpOnly: true` — inaccessible depuis JavaScript
  - `secure: true` en production — envoyé uniquement via HTTPS
  - `sameSite: 'none'` en production — permet le cross-origin (Vercel → Render)
  - `maxAge: 1h` — expiration automatique
- `backend/middlewares/authMiddleware.js` — Lit le token depuis `req.cookies.token` (avec fallback sur le header `Authorization` pour compatibilité)
- `backend/server.js` — Ajout de `cookie-parser` et `cors({ credentials: true })`
- Ajout des routes `POST /api/auth/logout` (supprime le cookie) et `GET /api/auth/me` (vérifie la session)

### Côté frontend

**Fichiers modifiés :**
- `frontend/src/services/api.js` — Instance axios avec `withCredentials: true` pour envoyer/recevoir les cookies
- `frontend/src/services/adminApi.js` — Utilise l'instance api partagée (plus besoin de gérer le header Authorization manuellement)
- `frontend/src/pages/Login.js` — Ne stocke plus le token, seulement `username`, `role` et `isAuthenticated` dans localStorage
- `frontend/src/components/Navbar.js` — Appelle `POST /api/auth/logout` au lieu de juste supprimer le localStorage
- `frontend/src/components/ProtectedRoute.js` — Vérifie `isAuthenticated` au lieu de `token`
- `frontend/src/components/AdminRoute.js` — Idem

### Variable d'environnement à ajouter sur Render (backend)

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | URL Vercel du frontend (ex: `https://mon-app.vercel.app`) |

---

## 3. Gestion des erreurs non gérées

**Problème :** Une erreur non capturée (rejet de promesse, exception) pouvait crasher le serveur sans aucun log.

**Solution :**

### Backend (`backend/server.js`)
- Ajout d'un **middleware d'erreur global** Express qui capture toute erreur non gérée dans les routes et renvoie une réponse `500` propre
- Ajout de handlers `process.on('unhandledRejection')` et `process.on('uncaughtException')` pour capturer les erreurs hors du cycle Express
- Ajout de **try/catch** dans tous les controllers qui en manquaient :
  - `productController.getProducts` — n'avait pas de try/catch
  - `orderController.getOrders` — n'avait pas de try/catch
  - `orderController.deleteOrder` — n'avait pas de try/catch ni de logique de suppression réelle

### Frontend
- Les appels API dans `Order.js`, `Login.js`, `Register.js` gèrent désormais les erreurs de validation Joi (affichage des messages `errors[]` renvoyés par le backend)

---

## 4. React-Toastify (remplacement de connect-flash pour SPA)

**Problème :** L'application utilisait `alert()` pour afficher les messages à l'utilisateur. `alert()` bloque l'interface et offre une mauvaise expérience utilisateur. Le module `connect-flash` est conçu pour les applications avec rendu serveur (EJS, Pug), pas pour les SPA React.

**Solution :** Installation de `react-toastify` — équivalent moderne de connect-flash pour React.

**Package installé :** `react-toastify`

**Configuration :** `frontend/src/index.js` — Ajout de `<ToastContainer>` avec :
- Position : `top-right`
- Auto-close : 3 secondes

**Fichiers modifiés :**

| Fichier | Avant | Après |
|---|---|---|
| `Login.js` | `alert(message)` | `toast.success()` / `toast.error()` |
| `Register.js` | `alert(message)` | `toast.success()` / `toast.error()` avec affichage des erreurs Joi |
| `Order.js` | `alert(message)` | `toast.success()` / `toast.warn()` / `toast.error()` |
| `Navbar.js` | — | `toast.info('Déconnexion réussie')` |

---

## 5. ESLint et Prettier

**Problème :** Aucun outil de qualité de code n'était configuré. Le formatage était incohérent et les erreurs potentielles n'étaient pas détectées.

**Solution :**

### Packages installés (devDependencies du backend)
- `eslint` — Détection des erreurs et mauvaises pratiques
- `prettier` — Formatage automatique du code
- `eslint-config-prettier` — Désactive les règles ESLint qui conflictent avec Prettier

### Fichiers créés
- `backend/.eslintrc.json` — Configuration ESLint :
  - `no-unused-vars: warn` — Avertit sur les variables inutilisées
  - `no-console: warn` — Avertit sur les `console.log` (encourage l'utilisation de Winston)
- `.prettierrc` (racine) — Configuration Prettier partagée :
  - Simple quotes, point-virgules, trailing commas, 100 chars/ligne

### Scripts ajoutés au `backend/package.json`
- `npm run lint` — Vérifie le code
- `npm run lint:fix` — Corrige automatiquement
- `npm run format` — Formate avec Prettier

---

## 6. Winston — Gestion professionnelle des logs

**Problème :** Le backend utilisait `console.log` et `console.error` partout. Aucun horodatage, aucun niveau de log, aucune possibilité de filtrage ou d'export.

**Solution :** Remplacement de tous les `console.log`/`console.error` par Winston.

**Fichier créé :** `backend/config/logger.js`

**Configuration :**
- Format JSON avec timestamp (exploitable par des outils de monitoring)
- Sortie console colorisée pour le développement
- Niveau de log configurable via `process.env.LOG_LEVEL`

**Fichiers modifiés (remplacement console → logger) :**
- `backend/config/db.js`
- `backend/server.js`
- `backend/controllers/authController.js`
- `backend/controllers/orderController.js`
- `backend/controllers/productController.js`
- `backend/controllers/adminController.js`
- `backend/middlewares/authMiddleware.js`

### Niveaux utilisés
- `logger.info()` — Événements normaux (connexion, démarrage serveur)
- `logger.warn()` — Événements suspects (token invalide)
- `logger.error()` — Erreurs (échec DB, erreur serveur)

---

## 7. Sécurisation supplémentaire du serveur

### Helmet (headers HTTP sécurisés)
**Package :** `helmet`  
**Fichier :** `backend/server.js`  
Ajoute automatiquement les headers de sécurité : `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.

### Rate Limiting (anti brute-force)
**Package :** `express-rate-limit`  
**Fichier :** `backend/server.js`  
Limite les routes `/api/auth/*` à 20 requêtes par IP toutes les 15 minutes.

### CORS restrictif
Le CORS est maintenant configuré avec `origin: process.env.FRONTEND_URL` au lieu d'accepter toutes les origines, et `credentials: true` pour autoriser les cookies.

---

## Résumé des packages ajoutés

### Backend (`npm install`)
| Package | Rôle |
|---|---|
| `joi` | Validation des données entrantes |
| `winston` | Logging structuré |
| `cookie-parser` | Lecture des cookies HTTPOnly |
| `helmet` | Headers de sécurité HTTP |
| `express-rate-limit` | Protection anti brute-force |

### Backend (`npm install --save-dev`)
| Package | Rôle |
|---|---|
| `eslint` | Linting du code |
| `prettier` | Formatage du code |
| `eslint-config-prettier` | Compatibilité ESLint/Prettier |

### Frontend (`npm install`)
| Package | Rôle |
|---|---|
| `react-toastify` | Notifications utilisateur (remplacement de alert/connect-flash) |

---

## Variables d'environnement à ajouter sur Render (backend)

| Variable | Valeur | Raison |
|---|---|---|
| `NODE_ENV` | `production` | Active les flags `secure` et `sameSite` sur les cookies |
| `FRONTEND_URL` | URL Vercel complète | CORS restrictif + cookies cross-origin |
