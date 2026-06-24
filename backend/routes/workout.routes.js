const express = require('express');
const router = express.Router();
const WorkoutController = require('../controllers/workout.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All workout routes are protected
router.use(authMiddleware);

// GET /api/workouts
router.get('/', WorkoutController.getAll);

// GET /api/workouts/:id
router.get('/:id', WorkoutController.getOne);

// POST /api/workouts
router.post('/', WorkoutController.create);

// PUT /api/workouts/:id
router.put('/:id', WorkoutController.update);

// DELETE /api/workouts/:id
router.delete('/:id', WorkoutController.delete);

// POST /api/workouts/:id/exercises
router.post('/:id/exercises', WorkoutController.addExercise);

// PATCH /api/workouts/:id/exercises/:weId
router.patch('/:id/exercises/:weId', WorkoutController.updateExercise);

// DELETE /api/workouts/:id/exercises/:weId
router.delete('/:id/exercises/:weId', WorkoutController.removeExercise);

module.exports = router;