import { Router } from 'express';
import { RoutineWeekRepository } from '@/repositories/RoutineWeekRepository';
import { RoutineWeekService } from '@/services/RoutineWeekService';
import { RoutineWeekController } from '@/controllers/RoutineWeekController';

const router = Router();

const repository = new RoutineWeekRepository();
const service = new RoutineWeekService(repository);
const controller = new RoutineWeekController(service);

// Routes
router.get('/', controller.getAll);
router.put('/:id', controller.update);

// Configuration routes
router.get('/:id/configuration', controller.getConfiguration);
router.put('/:id/configuration', controller.updateConfiguration);
router.delete('/:id/configuration', controller.deleteConfiguration);

export default router;
