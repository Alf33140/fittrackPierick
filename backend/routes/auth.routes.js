//===================
//routes/auth.routes.js - définition des routes d'authentification
//
//le routeur Express regroupes les routes d'un m^me domain fonctionnel.
//Il est monté dans le serveur .js sous le préfixe/api/auth
//son role : relier une URL + méthode HTTP à un controleur.
//==============

const express = require('express');

// express.Router() crée un mini routeur indépendant qu'on peut exporter
// et brancher dans server.js avec app.use('api/auth', authRoutes)

const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

//POST /api/auth/register - Création de compte (publique, pas de JWT requis)
router.post('/register', AuthController.register);

//POST /api/auth/login - Connexion (publique, pas de JWT requis)
router.post('/login', AuthController.login)

// GET /api/auth/me - Profil de 'utilisateur connecté (protégé par JWT)
// authMiddlware est passé en 2eme argument : il s'exécute AVANT AuthController.me
// Si le token est  absent/invalide, authMiddleware répond 401 et . me n'est jamais acquis
router. get('/me', authMiddleware, AuthController.me);

module.exports = router;
