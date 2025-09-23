import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { exerciseRoutes } from './routes/exerciseRoutes';
import { pool } from './config/database';

// Create Express application
const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Server is unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api/v1/exercises', exerciseRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      exercises: {
        'GET /api/v1/exercises': 'Get all exercises with filters',
        'GET /api/v1/exercises/:id': 'Get exercise by ID',
        'GET /api/v1/exercises/category/:category': 'Get exercises by category',
        'GET /api/v1/exercises/search': 'Search exercises',
        'GET /api/v1/exercises/metadata': 'Get exercise metadata',
        'GET /api/v1/exercises/stats': 'Get exercise statistics',
        'POST /api/v1/exercises': 'Create new exercise',
        'PUT /api/v1/exercises/:id': 'Update exercise',
        'DELETE /api/v1/exercises/:id': 'Delete exercise'
      },
      health: {
        'GET /health': 'Health check endpoint'
      }
    }
  });
});

// Global error handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

export default app;