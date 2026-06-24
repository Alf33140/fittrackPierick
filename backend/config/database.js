// config/database.js --- connexion à la base de donnée mySQL
// ce fichier crée et exporte un poool de connexion réutilisable

const mysql = require('mysql2/promise');

// qu'est ce qu'un pool de connexion?
// etablir une connexion mysql à chaque requete est couteux (~100ms).
// un pool maintient un ensemble de connecion ouverte et prete à l'emploie
// quand une requette arrive, elle prend une connexion disponible, l'utilise, 
// puis la relache dans le pool (elle n'est pas fermé, juste réutilisé)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT) || 3306, 
    database: process.env.DB_NAME || 'fittrack', 
    user: process.env.DB_USER || 'fittrack_user', 
    password: process.env.DB_PASSWORD || 'fittrack_pass', 

    //utf8mb4 supporte tous les caractères Unicode (dont les emoji et accents)
    // sans ça, les caractères spéciaux peuvent être corrompus à l'insertion
    charset : 'utf8mb4',

    //waitForConnections : si le pool est plein, mettre la requete en file d'attente
    //plutot que de retourner une erreur immédiatement
    waitForConnections: true,

    // Nombremaximum de connexions simultanées dans le pool
    connectionLimit: 10,

    //0 = file d'attente illimité (0 signifie pas de limite)
    queueLimit: 0,

    //stocke les dates en UTC dans MySQL pour éviter les décalages horraires
    timezone: '+00:00',
});

// ---------------- Test de connexion au démarrage -------------
// on vérifie immédiatement que mysql est joignable
// getConnection() prend une connexion du pool, connect.release() la remet à disposition
// si ça échoue (MySQL pas encore démarré), un message d'erreur est affiché.
pool.getConnection()
    .then(conn => {
        console.log('MySQL connected succesfully');
        conn.release();
    })
    .catch(err => {
        console.error('MySQL connection failed:', err.message);
    });
// export du pool: tous les models l'importent pour executer des requestes sql
module.exports = pool;

