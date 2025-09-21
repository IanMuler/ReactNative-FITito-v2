import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Import configuration and middleware
import { config } from '@/config/environment';
import { requestIdMiddleware, requestLogger, errorLogger } from '@/middleware/requestLogger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

// Import routes (to be created)
// import { healthRoutes } from '@/routes/health';

// Create Express application
const app: Application = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Disable for development
  contentSecurityPolicy: config.server.isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
  ],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.url.includes('/health');
  },
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  strict: true,
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
}));

// Compression middleware
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress if response is larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  },
}));

// Request logging and tracking
app.use(requestIdMiddleware);
app.use(requestLogger);

// Health check endpoint (simple implementation)
app.get('/health', (_req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv,
    version: process.env['npm_package_version'] || '1.0.0',
    services: {
      // Add service checks here when implemented
      // database: 'connected',
    },
  };

  res.status(200).json({
    success: true,
    data: healthCheck,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes (placeholder)
app.get(config.api.baseUrl, (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'FITito API v2.0',
      version: config.api.version,
      environment: config.server.nodeEnv,
      endpoints: {
        health: '/health',
        api: config.api.baseUrl,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes (to be implemented)
// app.use('/health', healthRoutes);
// app.use(config.api.baseUrl + '/users', userRoutes);
// app.use(config.api.baseUrl + '/exercises', exerciseRoutes);
// app.use(config.api.baseUrl + '/routines', routineRoutes);

// Error logging middleware (must be before error handler)
app.use(errorLogger);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server function
const startServer = (): void => {
  const server = app.listen(config.server.port, config.server.host, () => {
    console.log(`
🚀 FITito Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Environment: ${config.server.nodeEnv.toUpperCase()}
🌍 Server URL: http://${config.server.host}:${config.server.port}
🏥 Health Check: http://${config.server.host}:${config.server.port}/health
🔗 API Base URL: http://${config.server.host}:${config.server.port}${config.api.baseUrl}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('✅ Server closed successfully');
      // Close database connections here when implemented
      process.exit(0);
    });
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export app for testing
export default app;