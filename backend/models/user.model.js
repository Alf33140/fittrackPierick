// ===================
// models/user.model.js - couche d'acces aux données (table user)
//
//Le modèle est la seule partie du code qui écrit du sql.
// Il isole la logique de base de donnée du reste de l'application : 
//si on change de bdd deman, seul ce fichier est à modifier
// ====================

const db = require('../config/database');
const bcrypt = require('bcrypt');

//Nombre de "tours" de hachage bcrypt. Plus c'est élevé, plus c'est lent
// et donc plus résistant aux attaques par force brute) mais aussi plus couteux en CPU
// 1à est la valeur recommandé par défaut
// 10 = ~100 ms par hash en 2025 - bon équilibre sécurité/performance
// Plus élevé = plus résistant aux brute-force, mais plus lent pourl'API.
const SALT_ROUNDS = 10;

const UserModel = {
    // ---- Create : Inscrire/créer un utilisateur ----------
    async create({username, email, password, weight, goal}) {
        // On hache le mot de passe AVANT de l'insérer en base
        // bcrypt.hash() génère un sel aléatoire et produit un hash de 60 caractères
        // Même si la BDD est compromise, les mots de pase restent illisibles.
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // db.execute() utilise des requêtes préparées avec des ? (paramètres liés).
        // Chaque ? est remplacé de façon sécurisée -- protection contre l'injection SQL
        // Ne JAMAIS concaténé des variables directement dans une requete SQL
        const [result] = await db.execute(
            'INSERT INTO User (username, email, password, weight, goal) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, weight || null, goal || 'maintain']
            // weight || null : si non fourni, on stocke NULL plutôt que undefined
            // goal || 'maintain' : valeur par défaut si goal non fourni
        );
        //result.insertId = l'id AUTO_INCREMENT généré par MySQL
        return result.insertId;
    },
    // -- READ : Trouver par email (pour le login + et la vérification de doublon) -----
    async findByEmail(email) {
        //db.execute retourne [rows, fields] - destructuring pour garder rows/ on destructure pour ne garder que rows
        const [rows] = await db.execute (
            'SELECT * FROM User WHERE email = ?',
            [email]
        );
        // rows[0] = premier résultat, ou undefined si pas trouvé | on retourne null plutôt qu'undefined pour des vérifications 
        return rows[0] || null;
    },

    // -- READ: trouver par id (pour GET /me et après création  | profil utilisateur) ---------
    // On sélectionne explicitement les colonnes pour ne PAS retourner le mot de passe
    // IMPORTANT: on liste explicitement les colonnes pour ne PAS retourner 
    // le hash du mot de passe dans les réponses API
    async findById(id){
        const [rows] = await db.execute(
            'SELECT id, username, email, weight, goal, created_at FROM User WHERE id = ?',
            // "password est volontairement absent de cette liste"
            [id]
        );
        return rows[0] || null;
    },

    // --- READ : Trouver par username (pour vérifier les  doublons à l' inscription) -- 
    async findByUsername(username){
        const [rows] = await db.execute(
            'SELECT id FROM User Where username = ?',
            // On sélectionne seulement id: on veut juste savoir s'il existe
            [username]
        );
        return rows[0] || null;
    },

    // --- Update: Mise à jour partielle du profil ----
    async update(id, {username, weight, goal}) {
        // Technique de mise à jour dynamique: on ne modifie QUE les champs
        // effectivement envoyés. Si username est undefined, on ne le touche pas.
        const fields = [];
        const values = [];
        if (username !== undefined) {fields.push('username = ?'); values.push(username);}
        if (weight !== undefined) {fields.push('weight = ?'); values.push(weight)}
        if (goal !== undefined) {fields.push('goal = ?'); values.push(goal)}

        // Rien à mettre à jour-> on retourne l'utilistaur tel quel | Si aucun champ n'est fourni, rien à modifer -> on retourne null
        if (fields.length === 0) return null;
        // L'id doit être en DERNIER car il correspond au ? de la clause WHERE
        values.push(id);

        // Template literal pour constuire la requête dynamiquement
        // ex: " UPDATE User SET username = ?, weight = ? WHERE id = ? "
        await db.execute(`UPDATE User SET ${fields.join(', ')} WHERE id = ?`, values);

        // on retourne le profil mis à jour (sans le mot de passe grâce à findById)
        return this.findById(id);
    },
        //---- VERIFY : Vérifier le mot de passe lors du login -------
        // bcrypt.compare() re-hash le mot de passe en clair avec le sel/salt stocké
        // dans le hash, puis compare les deux hashs.
        // Retourne true si ça correspond, false sinon.
        //On ne peut PAS inverser un hash bcrypt (fonction à sens unique).
        async verifyPassword(plainPassword, hashedPassword) {
            return bcrypt.compare(plainPassword, hashedPassword);
        },

};

module.exports = UserModel;

