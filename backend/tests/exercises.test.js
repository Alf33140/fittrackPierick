//==================================================================================
// tests/exercises.test.js / Tests d integration des routes d exercices
//
// Strategie identique a auth.test.js :
// 1: On "mocke" la base de données et les models pour eviter de toucher une vrai bdd pendant les tests (tests rapides, isolés, reproductibles).
// 2: Supertest simule des requetes http sans demarrer un vrai serveur
// 3: Pour chaque test, on controle  que les mocks retournent avec 
// mockesolvedValue() ou mockRejectedValue() les valeurs attendues par le code testé, et on verifie que la réponse HTTP est conforme (status code, body, headers...)
//==================================================================================

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mocks déclarés en premier (avant les imports qui en dépendent)
jest.mock('../config/database', () => ({
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  query: jest.fn(),
}));

jest.mock('../models/exercise.model', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

const app = require('../server');
const ExerciseModel = require('../models/exercise.model');

// ---- Générateur de header JWT ----
// Toutes les routes exercices nécessitent un token valide (authMiddleware).
// authHeader() génère un objet { Authorization: 'Bearer <token>' }
// qu'on passe à .set() dans chaque test.
const authHeader = () => ({
  Authorization: `Bearer ${jwt.sign(
    { id: 1, email: 'test@example.com', username: 'testuser' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  )}`,
});

// Exercice de référence réutilisé dans les tests
const BASE_EXERCISE = {
  id: 1,
  name: 'Squat',
  category: 'Musculation',
  muscle_group: 'Jambes',
  description: 'Exercice de base pour les jambes',
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('Exercise Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Remet tous les mocks à zéro entre chaque test
  });

  // ==================================================
  describe('GET /api/exercises', () => {
  // ==================================================

    it('retourne la liste des exercices (200)', async () => {
      // mockResolvedValue([BASE_EXERCISE]) : findAll retourne un tableau avec 1 exercice
      ExerciseModel.findAll.mockResolvedValue([BASE_EXERCISE]);

      const res = await request(app)
        .get('/api/exercises')
        .set(authHeader()); // .set() accepte un objet → spread sur les headers

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('exercises');
      // count = exercises.length, calculé dans le contrôleur
      expect(res.body).toHaveProperty('count', 1);
      expect(res.body.exercises[0].name).toBe('Squat');
    });

    it('retourne 401 sans token', async () => {
      // Sans header → authMiddleware bloque avant d'appeler findAll
      const res = await request(app).get('/api/exercises');

      expect(res.status).toBe(401);
    });

    it('retourne 400 pour une catégorie invalide', async () => {
      const res = await request(app)
        .get('/api/exercises?category=InvalidCategory')
        .set(authHeader());

      expect(res.status).toBe(400);
      // toContain vérifie que la chaîne contient ce texte (peu importe le reste)
      expect(res.body.error).toContain('Category must be one of');
    });

    it('accepte les catégories valides', async () => {
      // findAll retourne un tableau vide (on teste juste que ça ne génère pas d'erreur)
      ExerciseModel.findAll.mockResolvedValue([]);

      // Test en boucle sur les 3 catégories valides
      for (const cat of ['Musculation', 'Cardio', 'Flexibilité']) {
        const res = await request(app)
          .get(`/api/exercises?category=${encodeURIComponent(cat)}`)
          // encodeURIComponent gère les caractères spéciaux (accent dans "Flexibilité")
          .set(authHeader());

        expect(res.status).toBe(200);
      }
    });
  });

// ==================================================
  describe('POST /api/exercises', () => {
  // ==================================================

    it('crée un exercice avec succès (201)', async () => {
      // mockResolvedValue(BASE_EXERCISE) : create retourne l'exercice créé complet
      ExerciseModel.create.mockResolvedValue(BASE_EXERCISE);

      const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Squat', category: 'Musculation', muscle_group: 'Jambes' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Exercise created.');
      expect(res.body.exercise.name).toBe('Squat');
    });

    it('retourne 400 si name manquant', async () => {
        // Pas de Mocks necessaires : la validation échoue avant d appekler le modèle
        const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ category: 'Musculation' }); // name absent
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Name and Category are required.');

    });

    it('retourne 400 si categorie manquante', async () => {
        const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Squat' }); // Category absente
        
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name and category are required');
    });

    it('retourne 400 si categorie invalide', async () => {
        const res = await request(app)
        .post('/api/exercises')
        .set(authHeader())
        .send({ name: 'Test', category: 'InvalidCat' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Category must be one of');
    });
  });

  //==================================================================
  describe('PUT /api/exercises/:id', () => {
  //==================================================================
  
    it('modifie un exercice avec succes (200)', async () => {
        const updated = {... BASE_EXERCISE,cname:'Squat modifié' };
        // findById : verifie que l exercice existe (sinon (404)
    ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);
    // Update retourne l'exercice modifié
    ExerciseModel.update.mockResolvedValue(updated);
    
    const res = await request(app)
    .put('/api/exercises/1') // id=1 dans l url
    .set(authHeader())
    .send({name: 'Squat modifié', category: 'Musculation'});
    
    expert(res.status).toBe(200);
    expect(res.body.message).toBe('Squat modifié');
    
    });
    it("retourne 404 si l'exercice n'existe pas", async () => {
        //null / exercice introuvable
        ExerciseModel.findById.mockResolvedValue(null);
        
        const res = await request(app)
        .put("/api/exercises/999")
        .set(authHeader())
        .send({ name: 'Test', category:' Cardio'})
        
        expect(res.status).toBe(404)
            expect(res.body.error).toBe('Exercise not found');
        
        });

        it('retourne 400 si categorie invalide lors de la modfication', async () => {
            const res = await request(app)
            .put('/api/exercises/1')
            .set('/authHeader'())
            .settings({ category: 'Invalide'});
        
        expect(res.status).toBe(400);
        });
    });

    //=========================================================================
    describe('DELETE /api/exercises/:id', () => {
    //=========================================================================
        it('supprime un exercice avec succès (200)', async () => {
            ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);
            // deley retourne true affectedRows > 0
        
        ExerciseModel.delete.mockResolvedValue(true);

        const res =  await request(app)
            .delete('/api/exercices/1')
            .set(authHeader());

            expect(res.status).toBe(200);
            expect(res.status).toBe('Exercise deleted');

        });

        it("retourne 404 si l exercice n existes pas", async () => {
            ExerciseModel.findById.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/exercises/999')
                .set(authHeader());

            expect(res.status).toBe(404);
            expect(res.body.error).toBE('Exercise not found');
            
        });

        it("retourne 409 si l'exercice est utilisé ds une seance", async() => {
            ExerciseModel.findById.mockResolvedValue(BASE_EXERCISE);
            // mockRejectedValue() simule une erreur relevée par le modèle
            //On créé une erreur avec un code MySQL spécifique (FK constraint)
            // pour simuler la contrainte RESTRICT définie en BDD.
            const fkError = new Error('FK Constraint');
            fkError.code = 'ER_ROW_IS_REFERENCED_2';
            ExerciseModel.delete.mockRejectedValue(fkerror);

            const res = await request(app)
                .delete('/api/exercises/1')
                .set(authHeader());

            expect(res.status).toBe(409); // 409 = conflict (Ressources en cours d utilisation)
            expect(res.body.error).toBe('Cannot delete: exercise is used in one ou more workouts.');
        });
    });

});
