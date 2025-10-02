import { Router } from 'express';
import { HealthController } from '@/controllers/HealthController';
import { HealthService } from '@/services/HealthService';

const router = Router();
const service = new HealthService();
const controller = new HealthController(service);

router.get('/', controller.basicHealthCheck);

export default router;
