import { Router } from 'express';
import { ExerciseController } from '../controllers/exerciseController';
import { validateExerciseCreation, validateExerciseUpdate } from '../middleware/exerciseValidation';

const router = Router();
const exerciseController = new ExerciseController();

// GET /api/v1/exercises - Get all exercises with filters
router.get('/', exerciseController.getExercises);

// GET /api/v1/exercises/search - Search exercises
router.get('/search', exerciseController.searchExercises);

// GET /api/v1/exercises/metadata - Get exercise metadata
router.get('/metadata', exerciseController.getExerciseMetadata);

// GET /api/v1/exercises/stats - Get exercise statistics
router.get('/stats', exerciseController.getExerciseStats);

// GET /api/v1/exercises/category/:category - Get exercises by category
router.get('/category/:category', exerciseController.getExercisesByCategory);

// GET /api/v1/exercises/:id - Get exercise by ID
router.get('/:id', exerciseController.getExerciseById);

// POST /api/v1/exercises - Create new exercise
router.post('/', validateExerciseCreation, exerciseController.createExercise);

// PUT /api/v1/exercises/:id - Update exercise
router.put('/:id', validateExerciseUpdate, exerciseController.updateExercise);

// DELETE /api/v1/exercises/:id - Delete exercise
router.delete('/:id', exerciseController.deleteExercise);

export { router as exerciseRoutes };