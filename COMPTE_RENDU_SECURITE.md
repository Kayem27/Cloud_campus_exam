# Compte rendu - Correction des failles de sécurité et mauvaises pratiques

**Date :** 03/04/2026  
**Objectif :** Identifier et corriger les failles de sécurité et mauvaises pratiques dans l'ensemble du projet

---

## Failles corrigées

### 1. Fuite de tokens JWT dans les logs

| Fichier | Problème | Correction |
|---|---|---|
| `backend/middlewares/authMiddleware.js:7` | `console.log(token)` exposait le JWT de chaque requête authentifiée dans les logs serveur | Supprimé |
| `backend/controllers/authController.js:24` | `authLog(token)` loguait le JWT généré à chaque connexion | Supprimé |
| `frontend/src/services/api.js:11` | `console.log(token)` exposait le JWT dans la console du navigateur (visible par n'importe quelle extension) | Supprimé |

**Risque :** Un attaquant ayant accès aux logs ou à la console navigateur pouvait récupérer des tokens JWT valides et usurper l'identité d'un utilisateur.

---

### 2. Fuite de mots de passe en clair dans les logs

| Fichier | Problème | Correction |
|---|---|---|
| `backend/controllers/authController.js:12` | `authLog(username, password)` loguait le mot de passe en clair à chaque tentative de connexion | Remplacé par `authLog(login attempt for username: ${username})` |
| `backend/controllers/authController.js:35` | `authLog(username, email, password)` loguait le mot de passe en clair à chaque inscription | Remplacé par `authLog(register attempt for username: ${username})` |

**Risque :** Les mots de passe en clair dans les logs sont une violation majeure. Toute personne avec accès aux logs (développeur, hébergeur, outil de monitoring) pouvait lire les mots de passe de tous les utilisateurs.

---

### 3. Fuite de données utilisateur dans les logs

| Fichier | Problème | Correction |
|---|---|---|
| `backend/controllers/authController.js:17` | `authLog(JSON.stringify(user))` exposait l'objet utilisateur complet (dont le hash du mot de passe) | Supprimé |
| `backend/controllers/authController.js:42` | `authLog(JSON.stringify(existingUser))` exposait les données d'un utilisateur existant | Supprimé |
| `backend/controllers/authController.js:50` | `authLog(JSON.stringify(user))` exposait l'utilisateur nouvellement créé (avec le hash) | Supprimé |
| `backend/controllers/orderController.js:9` | `console.log(JSON.stringify(req.user))` exposait les données utilisateur du token | Supprimé |
| `backend/controllers/orderController.js:12` | `console.log(JSON.stringify(req.body))` exposait tout le contenu des commandes | Supprimé |

---

### 4. Fuite de données de commande dans les logs

| Fichier | Problème | Correction |
|---|---|---|
| `backend/controllers/orderController.js:35` | `console.log(productId, quantity, price)` dans la boucle de création | Supprimé |
| `backend/controllers/orderController.js:57` | `console.log(savedOrder)` exposait toute la commande sauvegardée | Supprimé |
| `backend/controllers/orderController.js:152` | `console.log(orderId)` dans deleteOrder | Supprimé |
| `backend/controllers/orderController.js:171` | `console.log(orderId, status)` dans updateOrderStatus | Supprimé |
| `frontend/src/services/api.js:9` | `console.log(JSON.stringify(orderData))` exposait les données de commande côté client | Supprimé |

---

### 5. Fuite des données de notification dans les logs

| Fichier | Problème | Correction |
|---|---|---|
| `microservices/notifications/index.js:23` | `console.log(to, subject, text)` exposait le contenu des emails (destinataire, sujet, corps) | Supprimé |
| `microservices/notifications/index.js:6` | Code commenté `//console.log(JSON.stringify(process.env))` qui aurait exposé TOUTES les variables d'environnement (mots de passe inclus) si décommenté | Supprimé |

---

### 6. Fuite d'objet d'erreur dans la réponse API

| Fichier | Problème | Correction |
|---|---|---|
| `microservices/notifications/index.js:42` | `res.status(500).json({ message: '...', error })` renvoyait l'objet d'erreur complet au client (stack trace, détails internes) | Supprimé l'objet `error` de la réponse |

**Risque :** Les stack traces et objets d'erreur exposent la structure interne du code, les chemins de fichiers et potentiellement des informations sensibles à un attaquant.

---

### 7. Enumération d'utilisateurs (User Enumeration)

| Fichier | Problème | Correction |
|---|---|---|
| `backend/controllers/authController.js:18` | Message `"Utilisateur non trouvé"` quand le username n'existe pas | Remplacé par `"Identifiants incorrects"` |
| `backend/controllers/authController.js:21` | Message `"Mot de passe incorrect"` quand le mot de passe est faux | Remplacé par `"Identifiants incorrects"` |

**Risque :** Des messages d'erreur différents selon que l'utilisateur existe ou non permettent à un attaquant de deviner quels comptes existent dans la base (technique d'énumération). En utilisant un message identique, on ne révèle plus cette information.

---

### 8. Contrôle d'accès manquant (Broken Access Control)

| Fichier | Problème | Correction |
|---|---|---|
| `backend/routes/orderRoutes.js:10` | La route `DELETE /:id` n'avait que `authenticateToken` sans `isAdmin` — n'importe quel utilisateur connecté pouvait supprimer n'importe quelle commande | Ajout du middleware `isAdmin` |

**Risque :** Un utilisateur standard pouvait supprimer des commandes d'autres utilisateurs, ce qui constitue une faille de type Broken Access Control (OWASP Top 10 - A01).

---

### 9. URL hardcodée vers le gateway

| Fichier | Problème | Correction |
|---|---|---|
| `backend/controllers/orderController.js:61` | `http://localhost:8000/notify` en dur dans le code | Remplacé par `process.env.GATEWAY_URL \|\| 'http://localhost:8000'` |

**Risque :** En production, l'appel au microservice de notification échouerait silencieusement car `localhost:8000` ne pointe vers rien sur Render.

---

## Résumé par catégorie de risque

| Catégorie | Nombre de corrections | Sévérité |
|---|---|---|
| Fuite de mots de passe dans les logs | 2 | **Critique** |
| Fuite de tokens JWT | 3 | **Critique** |
| Contrôle d'accès manquant | 1 | **Haute** |
| Enumération d'utilisateurs | 2 | **Moyenne** |
| Fuite de données utilisateur/commande | 5 | **Moyenne** |
| Fuite de données de notification | 2 | **Moyenne** |
| Fuite d'objet d'erreur au client | 1 | **Moyenne** |
| URL hardcodée | 1 | **Basse** |

**Total : 17 corrections de sécurité**

---

## Recommandations supplémentaires (non corrigées)

Ces points nécessitent une réflexion ou des choix d'architecture :

1. **Rate limiting** — Aucune protection contre le brute force sur `/api/auth/login`. Recommandé : ajouter `express-rate-limit` pour limiter les tentatives de connexion.
2. **Helmet** — Ajouter le middleware `helmet` au backend et au gateway pour sécuriser les headers HTTP (X-Content-Type-Options, X-Frame-Options, etc.).
3. **Validation des entrées** — Aucune validation/sanitization des données entrantes (ex: `express-validator`). Les schémas Mongoose protègent partiellement, mais une couche de validation en amont serait plus robuste.
4. **Email de notification hardcodé** — L'adresse `syaob@yahoo.fr` est en dur dans `orderController.js`. Elle devrait être dans une variable d'environnement ou récupérée dynamiquement.
5. **CORS restrictif** — En production, restreindre `cors()` à l'URL exacte du frontend Vercel plutôt que d'accepter toutes les origines.
