//==============================================================================================
// tests/auth.test.js / Tests d integartion des routes d autjentification
//
// Styrategie de test:
// 1: On "mocke" la base de données et les models pour eviter de toucher une vrai bdd pendant les tests (tests rapides, isolés, reproductibles).
// 2: Supertest simule des requetes http sans demarrer un vrai serveur
// 3: Pour chaque test, on controle  que les mocks retournent avec 
// mockesolvedValue() ou mockRejectedValue() les valeurs attendues par le code testé, et on verifie que la réponse HTTP est conforme (status code, body, headers...)
//==============================================================================================

const request = require('supertest');
const jwt = require('jsonwebtoken');

// --- Mock de la base de données ---
// jest.mock() remplace l import réel par un faux objet controlé
// Ici, db.execute/getConnection/query ne font jamais ne font jamais de vrai connexion SQL
// Doit etre declaré AVANT d 'importer server ( qui importe lui-meme les models).

jest.mock('../config/database', () => ({
    execute: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
    query: jest.fn()
}));

// --- Mock du model User
// Chaque méthode est remplacée  par jest.fn() :  fonction espion qui
// ne fait rien par defaut  mais qu on peux configurer ds chaques tests

jest.mock('../models/user.model', () => ({
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    verifyPassword: jest.fn(),
    update: jest.fn(),
}));

// l appa est importée APRES les mocks  pour que le code utilise  les faux modules
const app = require('../server');
const UserModel = require('../models/user.model');

// Objet utilisateur de test réutilisé dans plusieurs cas de test
const BASE_USER = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    weight:null,
    goal: 'maintain',
    created_at: '2024-01-01T00:00:00.000Z',
};

// fonction utilitaire pour generer un JWT valide en test
const generateToken = (payload = {}) =>
    jwt.sign({id: 1, email: 'test@example.com', username: 'testuser', ...payload}, 
        process.env.JWT_SECRET, 
        {expiresIn: '1d'}
    );

describe('Auth routes', () => {
    // beforeEach s'execute  AVANT chaque test du describe
    // clearAllMocks remet tous les mocks à zero :  compteur d appel
    // valeurs de retour configurées, etc. Evite les effets de bord entre tests
    beforeEach(() => {
        jest.clearAllMocks();
    });

//================================
describe('POST /api/auth/register', () => {
//================================

    it("crée un compte avec succès (201)", async () => {
        // mockResolvedValue(null) : findByEmail retourne null _> email disponible
        UserModel.findByEmail.mockResolvedValue(null);
        UserModel.findByUsername.mockResolvedValue(null);
        // mockResolvedValue(1) : create retourne l'id 1 (insertId stimulé)
        UserModel.create.mockResolvedValue(1);
        UserModel.findById.mockResolvedValue(BASE_USER);

        //request(app) .post(url).send(body) simule un POST avec body JSON
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.message).toBe('Account created successfully.');
    });

    it('retourne 400 si username manquant', async () => {
        // Pas besoin de configurer les mocks : la validation échoue  avant d appeler le modele
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username, email and password are required.');
    });

    it('retourne 400 si le mot de passe < 6 caracteres', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: '12345'
            });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Password must be at least 6 characters.');
    });

    it('retourne 400 si l email est déjà utilisé', async () => {
        // mockResolvedValue(BASE_USER) : findByEmail retourne un utilisateur existant -> email déjà utilisé
        UserModel.findByEmail.mockResolvedValue(BASE_USER);
    
    const res = await request(app)
        .post('/api/auth/register')
        .send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });
        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Email already in use.');
    });

    it('retourne 400 si le username est déjà utilisé', async () => {
        UserModel.findByEmail.mockResolvedValue(null); // email disponible
        //  findByUsername retourne  { id:2 } un utilisateur existant -> username déjà utilisé
        UserModel.findByUsername.mockResolvedValue({ id: 2 });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test2@example.com',
                password: 'password123'
            });
        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Username already taken.');
    });
});

//=======================================
describe('POST /api/auth/login', () => {
//=======================================

    it('connecte avec succès (200)', async () => {
        // findByEmail retourne un user existant AVEC le password (pour la verification bcrypt)
        const userWithPassword = { ...BASE_USER, password: 'hashedpassword' };
        UserModel.findByEmail.mockResolvedValue(userWithPassword);
        // verifyPassword retourne true : le mot de passe fourni correspond au hash
        UserModel.verifyPassword.mockResolvedValue(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        // le mot de passe ne doisJAMAIS apparaitre ds la reponse
        expect(res.body.user).not.toHaveProperty('password');
        expect(res.body.message).toBe('Login successful.');

    });

    it('retourne 400 si champs manquant', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com'
                // password manquant
            });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email and password are required.');
    });
    it('retourne 401 si email non trouvé', async () => {
        UserModel.findByEmail.mockResolvedValue(null); // email non trouvé

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'unknown@example.com',
                password: 'password123'
            });
        expect(res.status).toBe(401);
        // le message d'erreur est volontairement vague pour ne pas révéler si l'email ou le mot de passe est incorrect
        // securité (anti-enumeration)
        expect(res.body.error).toBe('Invalid credentials.');
    });
    
    it('retourne 401 si mot de passe incorrect', async () => {
        // findByEmail retourne un user existant SANS le password (pour la verification bcrypt)
        const userWithPassword = { ...BASE_USER, password: "hashed_Password" };
        UserModel.findByEmail.mockResolvedValue(userWithPassword);
        UserModel.verifyPassword.mockResolvedValue(false); // mot de passe incorrect

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials.');
    });
});

//=======================================
describe('GET /api/auth/me', () => {
//=======================================

        it('retourne le profil avec un token valide (200)', async () => {
            // Aucun header Authorization -> authMiddleware refuse
            UserModel.findById.mockResolvedValue(BASE_USER);

            const token = generateToken();

            const res = await request(app)
                .get('/api/auth/me')
                // .set() ajoute un header HTTP à la requete simulée: ici le JWT Bearer pour authentification
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('retourne 401 si token invalide', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid.token.here');
            
            expect(res.status).toBe(401);
        });
    });
});
