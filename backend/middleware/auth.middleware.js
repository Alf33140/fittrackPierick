//---------------------------------------
//middleware auth/auth/auth.middleware.js - verification du jwt
//
//Un middleware express est une fonction (req, res, next) placée
//entre la réception de la requete et don traitement final
//Celui ci vérifie que l'utilisateur est authentifié avant de 
// laisser passer la requete vers le controlleur
//-------------

const jwt = require('jsonwebtoken');

//----Fonctionnement du JWT (JSON web token) -----
//un JWT est une chaine encode en base64 composé de 3 parties:
// Header.Payload.Signature
//
//Le serveur génère un token lors du login et le signe avec JWT_SECRET.
//Le client le stocke (localStorage) et l'envoie dans chaque requete : 
//  Authorization: Bearer ...........
//
// Pour vérifier, on re-signe le header-playload avec JWT_SECRET et on
//compare : si ce correspond, le token est authentique et non modiié.

const authMiddleware = (req, res, next) => {
    //lecture du header Authorization de la requête entrante
    const authHeader = req.headers.authorization;
    
    //Vérification de la premiere et du format "Bearer <token>" rappel "||" signifie "et"
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({error:'Acces denied. No token provided.'});
    // 401 = Non authentifié (il manque ou le token est absent/malinformé)
    }
    // On extrait uniquement le token (on retire le préfixe le préfixe "Bearer")
    const token = authHeader.split(' ')[1];

    try {
        //jwt.verify décode ET vérifi la signature avec la clé secreète.
        // Si le Token a été modifié ou signé avec une autre clé -> exception
        // si la date  d'expiration est dépassé -> exception TokkenExpiredError.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // On attache l'identité décodée à req.user pour que les controleurs
        // puissent savoir quel utilisateur fait la requete (req.user.id)
        req.user = {id:decoded.id, email: decoded.email, username: decoded.username};
        
        //next() passe la main au prochain middleware ou au controlleur
        next();
    } catch (err){
        //Distinction entre token expiré et token invalide pour un meilleur message
        if (err.name === 'TokkenExpiredError') {
            return res.status(401).json({error : 'Token expired. Please Login again.'});
        }
            return res.status(401).json({error : 'Invalid token.'});
        }
    };

    module.exports = authMiddleware;