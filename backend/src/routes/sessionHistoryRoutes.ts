/**
 * Session History Routes
 *
 * Defines HTTP routes for session history endpoints.
 */

import { Router } from 'express';
import { SessionHistoryService } from '@/services/SessionHistoryService';
import { SessionHistoryController } from '@/controllers/SessionHistoryController';

const router = Router();

// Initialize layers
const service = new SessionHistoryService();
const controller = new SessionHistoryController(service);

// Routes
router.post('/', controller.upsert);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.delete('/today', controller.deleteToday); // Must be before /:id to avoid route conflict
router.delete('/date', controller.deleteByDate); // Delete by date (any date)
router.delete('/:id', controller.delete);

export default router;
