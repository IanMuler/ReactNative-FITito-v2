import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';

// Set timezone to Argentina (UTC-3)
process.env.TZ = 'America/Argentina/Buenos_Aires';

// Create Express application
const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // HTTP request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(requestLogger); // Custom request/response logger

// Mount all routes (includes /health and /api/v1/*)
app.use(apiRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      health: {
        'GET /health': 'Health check endpoint'
      },
      exercises: {
        'GET /api/v1/exercises': 'Get all exercises',
        'GET /api/v1/exercises/:id': 'Get exercise by ID',
        'POST /api/v1/exercises': 'Create new exercise',
        'PUT /api/v1/exercises/:id': 'Update exercise',
        'DELETE /api/v1/exercises/:id': 'Delete exercise'
      },
      trainingDays: {
        'GET /api/v1/training-days': 'Get all training days',
        'GET /api/v1/training-days/:id': 'Get training day by ID',
        'POST /api/v1/training-days': 'Create training day',
        'PUT /api/v1/training-days/:id': 'Update training day',
        'DELETE /api/v1/training-days/:id': 'Delete training day'
      },
      routines: {
        'GET /api/v1/routines': 'Get all routines',
        'GET /api/v1/routines/:id': 'Get routine by ID',
        'POST /api/v1/routines': 'Create routine',
        'PUT /api/v1/routines/:id': 'Update routine',
        'DELETE /api/v1/routines/:id': 'Delete routine'
      },
      routineWeeks: {
        'POST /api/v1/routine-weeks/initialize': 'Initialize routine weeks',
        'GET /api/v1/routine-weeks': 'Get routine weeks',
        'PUT /api/v1/routine-weeks/:id': 'Update routine week',
        'PUT /api/v1/routine-weeks/:id/complete': 'Mark week as completed'
      },
      sessionHistory: {
        'POST /api/v1/session-history': 'Upsert session history',
        'GET /api/v1/session-history': 'Get session history (with optional date filter)',
        'GET /api/v1/session-history/:id': 'Get session history by ID',
        'DELETE /api/v1/session-history/:id': 'Delete session history',
        'DELETE /api/v1/session-history/today': 'Delete today\'s session and reset completed'
      },
      workoutHistory: {
        'GET /api/v1/workout-history/:profileId/:date': 'Get workout history (AsyncStorage legacy format)'
      }
    }
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;