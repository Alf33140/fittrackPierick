// C'est un module qu'on instale avec npm il permet de crée notre api ,
//  et toute nos routes qui sont attaché à ce serveur. c'est un framework 
// qui nous permet de créer notre serveur et  nos routes


require('dotenv').config();

const express = require('express');
const cors = require ('cors');

//on importechaque fichier - chacun gère un groupe de route
const authRoutes = require('./routes/auth.routes');
const exerciseRoutes = require('./routes/exercise.routes');
const workoutRoutes = require('./routes/workout.routes');
const statsRoutes = require('./routes/stats.routes');

//Création de l'application express
const app = express();

// Le port vient du .env; si absent; 5000 par défaut
const PORT = process.env.PORT || 5000;

// --- CORS (CROSS ORIGIN RESSOURCE SHARING) ----
// Par sécurité, les navigateurs bloquent les requetes vers un domaine different.
// ce middleware autorise explicitement le front end (localhost:3000) à appeler l'API.
// Sans cors, le navigateur rejetterait les requetes avant même qu'elles arrivent.
app.use(cors({
    origin: process.env.FRONTEND_url || 'http://localhost:3000',
    credentials: true, // Autorise l'envoie de cookies/header d'auth
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
// -- Middleware de parsing
// express.json() : lit le corps des requêtes en JSON et le met dans des req.body
// Sans lui, req.body serait undefined pour les POST/PUT avec du JSON
app.use(express.json());

// express.urlencoded() : lit les données de formulaires HTML classique
app.use(express.urlencoded({ extended: true}));

// ----------- Route de santé (Healthchek) -----------
// Permet de vérifier rapidement que l'API tourne (GET /api)
app.get('/api', (req,res)=>{
    res.json({
        message : 'FitTrack API is running',
        version : '1.0.0',
        endpoints:{
            auth: '/api/auth',
            exercises: '/api/exercises',
            workouts: '/api/workouts',
            stats: '/api/stats',
        },
    });
});

// ------ Branchement des routes ---------
// app.use(préfixe, routeur) : toutes les routes défiies dans le fichier
// seront accessibles sous ce préfixe.
// EX : routeur.post('/login) dans auth.routes.js -> POST /api/auth/login
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/stats', statsRoutes);

// --Middleware 404 -----
// si aucune route n'a correspondu, on répond avec une erreur 404
// Ce middleware doit être APRES toutes les routes
app.use((req, res) => {
    res.status(404).json({error: 'routes not found'});
});

// ---- Middleware de gestion des erreurs ----
// Signature spéciale avec 4 paramètre (err, req, res, next) : Express
// reconnait automatiquement ce middleware comme gestionnaire d'erreurs.
// Appelé quand on fait next(err) dans une route ou qu'une exception survient.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message});
});

// ----- Démarrage du serveur -----
// On ne démarre pas le serveur en mode test: les test importent
//directement "app" et Supertest crée son propre serveur temporaire
// Cela évite des conflits de port et des effet de bord dans les test
if(process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`FitTrack API running on port ${PORT}`);
        console.log(`Environnement: ${process.env.NODE_ENV}`);
    });
}

//Export de l'app pour les test (Supertest l'importe directement)
module.exports = app;