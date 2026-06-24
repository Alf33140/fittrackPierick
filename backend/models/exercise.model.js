//=========================================================
//models/exercise.model.js - Couche d'accès aux données (table Exercise)
// Toutes les requêtes SQL liées aux exercices passent par ici.
//Les contrôleurs appellent ces méthodes sans jamais écrire de SQL
//=========================================================

const db = require('../config/database');

const ExerciseModel = {

    // - READ ALL: lister les exercices avec filtres optionnels ---
    async findAll({ category, search } = {}) {
        // On démarre avec une condition toujours vraie (WHERE 1=1)
        // pour pouvoir ajouter des AND dynamiquement sans se soucier du 1er AND
        // WHERE 1=1 est une astuce classique du SQL dynamique :  1=1 est toujours vrai, ce qui permet d'enchainer des AND sans se soucier de savoir su c'est le premier filtre ou non.
        let query = 'SELECT * FROM Exercise WHERE 1=1';
        const values = [];

        // Filtrage par catégorie (ex: ?category=Musculation) ---- Ajouté seulement si category est défini et non vide
        if (category){
            query += ' AND category = ?';
            //query + 'AND category = ?' = query
            values.push(category);
        }

        // Recherche textuelle sur le nom OU le groupe musculaire
        // Like avec % = "contient" (ex: %squat% trouve "Front squat", "Back squat") Les deux ? correspondent aux deux valeurs `%${search}%` dans values
        if (search) {
            query += ' AND (name LIKE ? OR muscle_group LIKE ?';
            values.push(`%${search}%`, `%${search}%`); // Deux fois la même valeur car deux ? dans la requête
        }
        
        query += ' ORDER BY category, name';
        const [rows] = await db.execute(query, values);
        return rows;
    },

    // - READ ONE : Trouver un exercice par son id -
    async findById(id) {
        const [rows] = await db.execute ('SELECT * FROM Exercise WHERE id = ?',[id]);
        return rows[0] || null;
    },

    // CREATE: Créer un exercice -----
    async create({name, category, muscle_group, description}) {
        const[result] = await db.execute (
            'INSERT INTO Exercise (name,category, muscle_group, description) VALUES (?, ?, ?, ?)',
             [name, category, muscle_group || null, description || null]
        );//muscle_group et description sont optionnels -> null si absents
    // On relit l'exercice crée depuis la BDD pour retourner l'objet complet
    // (avec l'id AUTO_INCREMENT, created_at, etc) plutôt que de le reconstruire/que juste l'insertID
    return this.findById(result.insertId)
    },

    // UPDATE: Mettre à jour un exercice (mise à jour partielle) 
    async create(id, {name, category, muscle_group, description}) {
        // Même technique que UserModel.update : construction dynamique
        // pour mne modifier que les champs effectivement fournis dans la requête
        const fields = [];
        const values = [];
            
        if (name !== undefined) {fields.push('name = ?'); values.push(name);}
        if (category !== undefined) {fields.push('category = ?'); values.push(category);}
        if (muscle_group !== undefined) {fields.push('muscle_group = ?'); values.push(muscle_group);}
        if (description !== undefined) {fields.push('description = ?'); values.push(description);}

        // aucun champ à modifier -> on retourne l'existant sans toucher la BDD
        if (fields.length === 0) return this.findById(id);

        values.push(id); // l'id pour la clause WHERE (toujours en dernier)
        await db.execute(`UPDATE Exercise SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.findById(id); // Retourne l'exercice mis à jour
    },

        // --- DELETE : Supprimer un exercice ---
        async delete(id) {
            const [result] = await db.execute('DELETE FROM Exercise WHERE id = ?', [id]);
            // affectedRows indique combien de lignes ont été supprimées
            // si 0, l'exercice n'existait pas (ou est protégé par une contrainte FK).
            // La contrainte RESTRICT en BDD lèvera une erreur ER_ROW_IS_REFERENCED_2
            // si l'exercice est utilisé dans un Workout exercice (géré dans le contrôleur).
            return result.affectedRows > 0;
        },
};

module.exports = ExerciseModel