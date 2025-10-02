import { Router } from 'express';
import { TrainingDayRepository } from '@/repositories/TrainingDayRepository';
import { TrainingDayService } from '@/services/TrainingDayService';
import { TrainingDayController } from '@/controllers/TrainingDayController';

const router = Router();

// Initialize layers
const repository = new TrainingDayRepository();
const service = new TrainingDayService(repository);
const controller = new TrainingDayController(service);

// Routes - matching exercises-simple.js endpoints
router.get('/', controller.getAll);           // GET /api/v1/training-days?profile_id=X
router.get('/:id', controller.getById);       // GET /api/v1/training-days/:id?profile_id=X
router.post('/', controller.create);          // POST /api/v1/training-days
router.put('/:id', controller.update);        // PUT /api/v1/training-days/:id
router.delete('/:id', controller.delete);     // DELETE /api/v1/training-days/:id?profile_id=X

export default router;
