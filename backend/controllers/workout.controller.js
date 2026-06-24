// ================================
// controllers/workout.controller.js - logique métier des séances
//
// Gere les opérations de CRUD sur les séances et sur les exercises
// d'une séance (ajout, modification, suppresion d'un exercise).
// req.user est inejecté par authMidlleware (contient id, email, username).
//

const WorkoutModel = require('../models/workout.model');

const WorkoutController = {

    // --------- GET /api/worrkouts ---------
    // Retourne toutes les séances de l'utilisateur connecté
    async getAll(req,res){
        try {
            // req.user.id est l'id de l'utilisateur authentifié (depuis le JWT )
            // Chaque utilisateur ne voit que ses séances - isolation garantie côté SQL
            const workouts = await WorkoutModel.findAllByUser(req.user.id);
            // on renvoie la liste des séance et leiur nombre total en JSON
            res.json({workouts, count: workouts.length});
        } catch (err){
            //Si erreur on l'affiche dans les logs serveur pour débug
            console.error('GetAll workout error:', err);
            //et on renvoie une erreur 500 au client
            res.status(500).json({error: 'failed to fetch workouts.'});
        }
    },

    // ------- GET /api/workouts/:id ---
    //Retourne une séance avec ses exercvices déatillé
    async getOne(req, res){
        try {
            // on passe req.user.id pour que le modèle vérifie l'appartenance
            // un utilisateur ne peut pas acceder à la séance d'un autre
            const workout = await WorkoutModel.findById(req.params.id, req.user.id);
            if (!workout) return res.status(404).json({error: 'Workout not found.'});
            res.json({ workout });
        } catch (err) {
            res.status(500).json({error: 'faile to fetch workout.'});
        }
    },

    // ------ POST /api/workouts -------
    // Crée une séance avec ses exercices en une seule requête
    async create(req, res) {
        try {
            const {title, date, duration, notes, exercises} = req.body;

            if (!title || !date) {
                return res.status(400).json({error: 'Titlte and date are required.'});
            }

            //Etape 1 : création de la séance (sans exercice)
            const workoutId = await WorkoutModel.create({
                user_id: req.user.id, //Lié à l'utilisateur connecté
                title,
                date,
                duration,
                notes,
            });

            //Etape 2: ajout des exercies si fournis dans le nbody
            // Array.isArray() vérifie que exercises est bien dans un tableau (pas undefined)
            if (Array.isArray(exercises) && exercises.length > 0) {
                for (const ex of exercises) {
                    if (!ex.exercises_id) continue; // ignore les entrées sans exercices
                    await WorkoutModel.addExercise(workoutId, ex);
                }
            }

            //Etape 3: on relit la séance complète (avec exercise) pour la réponse
            const workout = await WorkoutModel.findById(workoutId, req.user.id);
            res.status(201).json({ message: 'Workout created.', workout})
        } catch (err) {
            console.error('Create workout error:', err)
            res.status(500).json({error: 'Failed to create workout.' });
        }
    },

    // ----------- PUT /api/workouts/:id
    // Met à jour une séance et remplace complètementr ses exercices
    async update(req,res) {
        try {
            const {title, date, duration, notes, exercises} = req.body;

            // Vérification d'exitence et d'appartenance AVANT la modification
            const existing = await WorkoutModel.findById(req.params.id, req.user.id);
            if (!existing) return res.status(404).json({error: 'Workout not found'});

            await WorkoutModel.update(req.params.id, req.user.id, { title, date, duration, notes});

            //SI exercices est fourni, on remplace tout (DELETE + INSERT)
            //Plus simple que de calculer le diff entre ancien et nouvel etat
            if(Array.isArray(exercises)) {
                await WorkoutModel.replaceExercises(req.params.id, exercises);
            }

            const workout = await WorkoutModel.findById(req.params.id, req.user.id);
            res.json({message : ' Workout updated.', workout});
        } catch (err) {
            res.status(500).json({error: 'Failed to update workout.'});
        }
    },

    //--------POST / api/workouts/:id/exercises ------
    // Ajoute un exercise à une séance existante
    async addExercise(req,res){
        try {
            //On verifie que la séance existe et appartient à l'utilisateur
            const workout = await WorkoutModel.findById(req.params.id, req.user.id);
            if (!workout) return res.status(400).json({error: 'Workout not found'});

            const {exercise_id, sets, reps, weight_used, duration} = req.body;
            if (!exercise_id) return res.status(400).json({error: 'Exercise_id is required'});

            await WorkoutModel.addExercise(req.params.id, { exercise_id, sets, reps, weight_used, duration});

            //On retourne la séance mise à jour (avec le nouvel exercice inclus)
            const updated = await WorkoutModel.findById(req.params.id, req.user.id);
            res.status(201).json({ message: 'Exercise added', workout: updated });
        } catch (err){
            res.status(500).json({ error: 'Failed to add exercise'});
        }
    },

    // Patch /api/workouts/:id/exercises/:weId ----
    // Modifie les stats (série, reps, poids) d'un exercie dans une séance
    async updateExercise(req, res){
        try {
            const workout = await WorkoutModel.findById(req.params.id, req.user.id);
            if (!workout) return res.status(404).json({error: 'Workout not found'});

            const {sets, reps, weight_used, duration} = req.body;

            // req.params.weId = id dans un WorkoutExercise (la table de jointure)
            // req.params.id = id de la séance (pour vérifier l'appartenance)
            await WorkoutModel.updateExercise(req.params.weId, req.params.id, {sets, reps, weight_used, duration});
            
            const updatde = await WorkoutModel.findById(req.params.id, req.user.id);
            res.json({message: 'Exercise updated.', workout: updated });
        }   catch (err) {
            res.status(500).json({error: 'Failed to update exercise.'});
        }
    },
    
    // -------- DELETE /api/workouts/:id/exercies/weId ----
    // Retire un exercice d'une séance (sans supprimer l'exercice lui même)
    async removeExercise(req, res){
        try {
            //On recupere la séance (workout) en bdd avec identification du user concerné
            const workout = await WorkoutModel.findById(req.params.id, req.user.id);
            // Si la séance n'existe pas ou appartient a un autre user -> erreur 404
            if (!workout) return res.status(404).json({error: 'Workout not found'});
            //On supprime l'exercice de la s"ance grace à son Id (id exercice et id séance)
            const deleted = await WorkoutModel.removeExercise(req.params.weId, req.params.id);
            // Si l'exercice n'a pas été trouvé dans cette séance là -> erreur 4044
            if (!deleted) return res.status(404).json({error: 'Exercise not doun in this workout.'});

            //on recupere la séance à nouveu, mais sans l'exercice qui aété supprimé
            const updated = await WorkoutModel.findById(req.params.id, req.user.id);
            res.json({message: 'Exercise removed.', workout: updated});            
        } catch (err) {
            res.status(500).json({error: 'Failed to remove exercise.'});
        }
    },

    // ------- DELETE /api/workout/:id ------
    // supprime une séance et tpus ses exercises (cascade dans la bdd)
    async delete(req,res){
        try {
            //delete() retourne false si la séance n'existe pas pi n,'appartient pas à l'user
            const deleted =await WorkoutModel.delete(req.params.id, req.user.id);
            if (!deleted) return res.status(404).json({error: 'Workout not found.'});
            res.json({message:'Workout deleted.'});
        } catch (err) {
            res.status(500).json({error : 'Failed to delete workout'});
        }
    },
};

module.exports = WorkoutController;