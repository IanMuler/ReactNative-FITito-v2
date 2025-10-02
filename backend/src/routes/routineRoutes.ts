import { Router } from 'express';
import { RoutineRepository } from '@/repositories/RoutineRepository';
import { RoutineService } from '@/services/RoutineService';
import { RoutineController } from '@/controllers/RoutineController';

const router = Router();

// Initialize layers
const repository = new RoutineRepository();
const service = new RoutineService(repository);
const controller = new RoutineController(service);

// Routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
