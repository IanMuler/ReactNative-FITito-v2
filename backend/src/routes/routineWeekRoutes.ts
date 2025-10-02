import { Router } from 'express';
import { RoutineWeekRepository } from '@/repositories/RoutineWeekRepository';
import { RoutineWeekService } from '@/services/RoutineWeekService';
import { RoutineWeekController } from '@/controllers/RoutineWeekController';

const router = Router();

const repository = new RoutineWeekRepository();
const service = new RoutineWeekService(repository);
const controller = new RoutineWeekController(service);

// Routes
router.post('/initialize', controller.initialize);
router.get('/', controller.getAll);
router.put('/:id', controller.update);

// Configuration routes
router.get('/:id/configuration', controller.getConfiguration);
router.post('/:id/configuration/initialize', controller.initializeConfiguration);
router.put('/:id/configuration', controller.updateConfiguration);
router.delete('/:id/configuration', controller.deleteConfiguration);

export default router;
