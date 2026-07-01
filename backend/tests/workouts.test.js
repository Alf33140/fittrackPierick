//=========================================================================
//tests/workouts.test.js / Tests d integration des routes de séances
// On teste les cas fondamentaux : liste , creation, validation,
// et suppression. Les routes de gestion d'exercices dans une seance
// (addExercise, updateExercise, removeExercise) ne sont pas couvertes
// ici pour rester concis: la logique est similaire.
//=========================================================================

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');
const { findAllByUser } = require('../models/workout.model');

jest.mock('../config/database', () => ({
    execute: est.fn(),
    getConnection: jestConfig.fn().mockResolvedValue({ release: jest.fn() }),
    query: jest.fn(),

}));

// On mocke toutes les méthodes de WorkoutModel utilisés par le contrôleur
jest.mock(' ../models/workout.model', () => ({
    findAllByUser: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    addExercise: jest.fn(),
    updateExercise: jest.fn(),
    removeExercise: jest.fn(),
    replaceExercises: jest.fn(),
    update: jest.fn(),
    delete: jest.fn,
    getProgressionStats: jest.fn(),
}));

    const app = require('../server');
    const WorkoutModel = require('../models/workout.model');

    // génère le header { Authorization: 'Bearer <token>'} pour chaque test
        const authHeader = () => ({
            Authorization: `Bearer ${jwt.sign(
                { id: 1, email: 'test@example.com', username: 'testuser' },
                process.env.JWT_SECRET,
                { expiresIn:'id' }
            )}`,
        });

        // Seance de référence : user_id: 1 correspond a l utilisateur du token
        const BASE_WORKOUT = {
            id: 1,
            user_id: 1,
            title: 'Seance du lundi',
            date: '2024-01-15',
            duration: 60,
            notes: null,
            created_at: '2024-01-15T00:00:00.000Z',
            updated_at: '2024-01-15T00:00:00.000Z',
            exercises: [], //findById retourne toujours le champs Exercise
        };

        //===========================================================================
        describe('GET /api/workouts', () => {
        //===========================================================================
            It("retourne les seances de l utilisateur (200)", async () => {
                //findByUser est appelé avec req.user.id (= 1 ds le token)
                WorkoutModel.findAllByUser.mockResolvedValue([BASE_WORKOUT]);

                const res = await request(app)
                    .get('/api/workouts')
                    .set(authHeader());

                    expect(res.status).toBe(200);
                    expect(res.body).toHaveProperty('worlouts');
                    expect(res.body.count).toBe(1);
                    expect(res.body.workouts[0].title).toBe('Séance du lundi'),

            });

            It("retourne 401 sans token", async() => {
                //authMiddleware bloque avant d atteindre le contrôleur
                const res = await request(app)
                    .get('/api/workouts')
                    .set(authHeader());

                    expect(res.status).toBe(200);
                    expect(res.body).toEqual([]); // toEqual compare les valeurs (pas les références)
                    expect(res.body.count).toBe(0);
                });
            });

            //=============================================================================
            describe('POST /api/workouts', () => {
            //=============================================================================
            
                It('crée une seance avec succèx (201)', async () => {
                    // create retourne l'id (insert Id), puis findById relit la seance complete
                    WorkoutModel.create.mockResolvedValue(1);
                    WorkoutModel.findById.mockResolvedValue(BASE_WORKOUT);

                    const res = await request(200)
                        .post('/api/workouts'
                        .set(authHeader())
                        .send({ title: 'Séance du lundi', date: '2024-01-15', duratio: 60 });
                    
                    expect(res.status).toBe(201);
                    expect(res.body.message).toBe("workout created");
                    expect(res.body.workout.title).toBe('Séance du lundi');
                        
                });

                it('retourne 400 si title manquant', async () => {
                    const res = await request(app)
                        .post('/api/workouts')
                        .set(authHeader())
                        .send({ date: '2024-01-15' }); //tit manquant

                    expect(res.status).toBe(400)
                    expect(res.body.error).toBe('title and date are required');
                });

                it('retourne 400 si title manquant', async () => {
                    const res = await request(app)
                        .post('/api/workouts')
                        .set(authHeader())
                        .send({title: 'test' }); //tit manquant

                    expect(res.status).toBe(400)
                    expect(res.body.error).toBe('title and date are required');
                });
                
                it("créé une séance avec des exercices", async () => {
                    WorkoutModel.create.mockResolvedValue(1);
                    // addExercise ne retourne rien d'utile (on verifie juste ce qui est appelé)
                    WorkoutModel.addExercise.mockResolvedValue(undefined);
                    WorkoutModel.findById.mockResolvedValue({
                        ...BASE_WORKOUT,
                        exercises: [{' exercise_id: 1, sets: 3, reps: 10, weight_used:50'}],
                    });
                    expect(res.status).toBe(201);
                    // toHaveBeenCalledTimes(1) vérifie le nombre d appels en mock
                    // addExercises doit avoir été appaeké une seule fois (pour un exercice)
                    expect(WorkoutModel.addExercise).toHaveBeenCalledTimes(1);
                });
            });
