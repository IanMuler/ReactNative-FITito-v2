import { Router } from 'express';
import { ExerciseController } from '../controllers/exerciseController';
import { ExerciseService } from '../services/exerciseService';
import { validateExerciseCreation, validateExerciseUpdate } from '../middleware/exerciseValidation';

const router = Router();
const exerciseService = new ExerciseService();
const exerciseController = new ExerciseController(exerciseService);

// GET /api/v1/exercises - Get all exercises
router.get('/', exerciseController.getAll);

// GET /api/v1/exercises/:id - Get exercise by ID
router.get('/:id', exerciseController.getById);

// POST /api/v1/exercises - Create new exercise
router.post('/', validateExerciseCreation, exerciseController.create);

// PUT /api/v1/exercises/:id - Update exercise
router.put('/:id', validateExerciseUpdate, exerciseController.update);

// DELETE /api/v1/exercises/:id - Delete exercise
router.delete('/:id', exerciseController.delete);

export default router;