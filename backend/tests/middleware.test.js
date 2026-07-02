//================================================================
// tests/middleware.test.js  tests unitaires pour le middleware JWT
//
// Strategie: On créé une mini-appli Express dédiée aux tests,
// avec une seulle route protégée par authMiddleware.Cela permet de 
// tester le middleware en isolation, sans dépendre des routes réelles
//================================================================

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth.middleware');

// Création d'une mini-appli Express pour les tests
// on n importe pas l'app principale pour eviter les effets de bord
// cette app n'a qu une route GET /protected qui retourne req.user si valide.

const createApp = () => {
    const app = express();
    app.get('/protected', authMiddleware, (req, res) => {
        res.json({ user: req.user });
    });
    return app;
};

describe('authMiddleware', () => {
    // creatApp() est appelé une seule fois  pour tous les tets du describe
    const app = createApp();

    // --- cas : Aucun header authorization ---

    it('retourne 401 sans header Authorization', async () => {
        // request(app) = Supertest : simule une requete HTTP sans seveur réel
        const res = await request(app).get('/protected');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Access denied. No token provided.');
    });

    // --- cas : format invalide : header Authorization mal formé (pas de prefixe Bearer---
    it('retourne 401 avec un format invalide (pas de Bearer)', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Invalid-Token-Format');
            // .set() ajoute un header HTTP à la requete simulée

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Access denied. No token provided.');
    });

    // --- cas : token present mais invalide/ corrompu (signature incorrecte) ---
    it('retourne 401 avec un token invalide', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer this is.totally.invalid');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid token.');
    });

    // --- cas : token expiré ---
    //expiresIn: '1s' pour générer un token qui expire rapidement 
    // la date d expiration est ds le passé
    it('retourne 401 avec un token expiré', async () => {
        const expiredToken = jwt.sign(
            { id: 1, email: 'test@example.com', username: 'testuser' },
            process.env.JWT_SECRET,
            { expiresIn: '-1s' }// token qui expire en 1 seconde
        );
    
    const res = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token.');
    });

    // --- cas : token valide req.user doit etre renseigné ---
    it('authorise avec un token valide et attache req.user', async () => {
        const token = jwt.sign(
            { id: 1, email: 'test@example.com', username: 'testuser' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
        });
    });
});