import { Router } from 'express';
import healthRoutes from './healthRoutes';
import exerciseRoutes from './exerciseRoutes';
import trainingDayRoutes from './trainingDayRoutes';
import routineRoutes from './routineRoutes';
import routineWeekRoutes from './routineWeekRoutes';
import sessionHistoryRoutes from './sessionHistoryRoutes';

const router = Router();

/**
 * API Routes Index
 * Centralizes all API routes for clean architecture
 */

// Health check (outside /api/v1)
router.use('/health', healthRoutes);

// V1 API Routes
const v1Router = Router();

v1Router.use('/exercises', exerciseRoutes);
v1Router.use('/training-days', trainingDayRoutes);
v1Router.use('/routines', routineRoutes);
v1Router.use('/routine-weeks', routineWeekRoutes);
v1Router.use('/session-history', sessionHistoryRoutes);

// TODO: Add remaining routes as they are implemented
// v1Router.use('/workout-sessions', workoutSessionRoutes);
// v1Router.use('/training-sessions', trainingSessionRoutes);

router.use('/api/v1', v1Router);

export default router;
