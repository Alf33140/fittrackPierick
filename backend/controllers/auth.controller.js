// ============================================================
// controllers/auth.controller.js — Logique d'authentification
//
// Un contrôleur reçoit la requête (req) du routeur, effectue
// la logique métier (validation, appels au modèle), puis envoie
// la réponse (res). Il ne fait jamais de SQL directement :
// c'est le rôle du modèle (UserModel).
// ============================================================

const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

// ---- Génération du token JWT ----
// jwt.sign(payload, secret, options) crée un token signé.
// Le payload contient les données accessibles sans vérification (non chiffrées !).
// Ne jamais y mettre le mot de passe ou des données sensibles.
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,         // Clé secrète — doit rester privée côté serveur
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Token valide 7 jours
  );
};

const AuthController = {

  // ---- POST /api/auth/register ----
  // Crée un nouveau compte utilisateur et retourne un token JWT.
  async register(req, res) {
    try {
      // req.body contient les données envoyées par le client en JSON
      const { username, email, password, weight, goal } = req.body;

      // Validation côté serveur — ne jamais faire confiance au client
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email and password are required.' });
        // 400 = Bad Request : la requête est mal formée
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      // Vérification des doublons avant insertion
      // On vérifie email ET username séparément pour donner un message précis
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already in use.' });
        // 409 = Conflict : la ressource existe déjà
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken.' });
      }

      // Création en base (le modèle hash le mot de passe avec bcrypt)
      const userId = await UserModel.create({ username, email, password, weight, goal });

      // On récupère l'utilisateur sans le mot de passe pour la réponse
      const user = await UserModel.findById(userId);
      const token = generateToken(user);

      // 201 = Created : une ressource a été créée avec succès
      res.status(201).json({
        message: 'Account created successfully.',
        token,
        user,
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Failed to create account.' });
      // 500 = Internal Server Error : erreur inattendue côté serveur
    }
  },

  // ---- POST /api/auth/login ----
  // Vérifie les identifiants et retourne un token JWT si valides.
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      // Recherche de l'utilisateur par email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Même message que pour un mauvais mot de passe : évite l'énumération
        // des comptes (un attaquant(hacker) ne peut pas savoir si l'email existe ou non)
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // bcrypt.compare() compare le mot de passe en clair avec le hash en base
      const isValid = await UserModel.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
        // 401 = Unauthorized : identifiants incorrects
      }

      // Destructuration avec renommage : on extrait `password` dans `_`
      // et on garde le reste dans `userWithoutPassword`.
      // La convention `_` signale une variable intentionnellement non utilisée.
      const { password: _, ...userWithoutPassword } = user;
      const token = generateToken(user);

      res.json({
        message: 'Login successful.',
        token,
        user: userWithoutPassword, // Le mot de passe ne quitte jamais le serveur
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed.' });
    }
  },

  // ---- GET /api/auth/me ----
  // Retourne le profil de l'utilisateur actuellement connecté.
  // Cette route est protégée : authMiddleware a déjà vérifié le JWT
  // et placé l'identité dans req.user avant d'arriver ici.
  async me(req, res) {
    try {
      // req.user.id est injecté par authMiddleware (voir auth.middleware.js)
      const user = await UserModel.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch profile.' });
    }
  },
};

module.exports = AuthController;