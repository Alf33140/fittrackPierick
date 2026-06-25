//================================
// Controllers/stats.controller.js -- Statisstiquer de progression
//
// Ce controleur est volontairement simple : il n'a qu'une seule
// responsabilité - agréger les stats de l'utilisateur connecté
// et les retourner en une seule réponse JSON structurée
//===============================

const WorkoutModel = require('../models/workout.model');
const UserModel = require('../models/user.model');

const StatsController = {

            //------Get /api/stats/progression ---
            // Retourne les statistiques complètes de l'utilisateur : résumé global,
            // historique mensuel, répartition par catégorie et séance récentes.
    async getProgression(req, res) {
        try {
            //une promise ou promesse, en javascript c'est un objet qui représente
            // le résultat futur d'une opération asynchrone
            // Promise.all([...]) exécute plusieurs requêtes asynchrones EN PARALLELE
            // Au lieu d'attendre la fin de la premiere pour lancer la seconde
            // (ce qui prendrait 2x plus de temps), les deux s'éxécutent simultanément.
            // La destructuration [stats, user] récupère les résultat dans l'ordre.
            const [stats, user] = await Promise.all([
                WorkoutModel.getProgressionStats(req.user.id), // 4 requête sql en 1
                UserModel.findById(req.user.id),
            ]);

            //On retourne les infos utilisateur utiles pour l'affichage du profil
            // (sans le mot de passe - findById le filtre déjà coté modèle)
            res.json({
                user : {
                    username: user.username,
                    weight: user.weight,
                    goal: user.goal,
                    member_since: user.created_at, // Date d'inscription pour 'Membre depuis'
                },
                stats, //Contient sumamry, monthly, byCategory, recent
            });
        }catch (err) {
            console.error('Stats error', err);
            res.status(500).jspn({error : 'Failed to fetch stats.'});
        }
    },
};

module.exports = StatsController