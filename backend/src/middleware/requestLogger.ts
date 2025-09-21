import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/environment';

// Extend Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

// Custom token for request ID
morgan.token('id', (req: Request) => req.requestId);

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req: Request) => {
  if (!req.startTime) return '0';
  return `${Date.now() - req.startTime}ms`;
});

// Custom token for request size
morgan.token('req-size', (req: Request) => {
  const size = parseInt(req.get('content-length') || '0', 10);
  return size ? `${size}b` : '0b';
});

// Custom token for user agent (truncated)
morgan.token('user-agent-short', (req: Request) => {
  const userAgent = req.get('User-Agent') || '';
  return userAgent.length > 50 ? `${userAgent.substring(0, 50)}...` : userAgent;
});

// Request ID middleware - adds unique ID to each request
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

// Create custom morgan format based on environment
const createLogFormat = (): string => {
  if (config.server.isDevelopment) {
    return ':id :method :url :status :response-time-ms :req-size -> :res[content-length]b :user-agent-short';
  }
  
  // Production format (more detailed)
  return JSON.stringify({
    requestId: ':id',
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time-ms',
    contentLength: ':res[content-length]',
    userAgent: ':user-agent',
    remoteAddr: ':remote-addr',
    date: ':date[iso]',
  });
};

// Configure morgan logger
export const requestLogger = morgan(createLogFormat(), {
  // Skip logging during tests
  skip: (_req: Request, _res: Response) => config.server.isTest,
  
  // Custom stream for production (can be extended to log to files or external services)
  stream: config.server.isDevelopment 
    ? process.stdout 
    : {
        write: (message: string) => {
          // In production, you might want to send logs to a logging service
          console.log(JSON.parse(message.trim()));
        }
      },
});

// Health check logger (lighter logging for health endpoints)
export const healthCheckLogger = morgan('tiny', {
  skip: (req: Request, _res: Response) => {
    // Skip logging for health checks in production to reduce noise
    return config.server.isProduction && req.url.includes('/health');
  },
});

// Error logger middleware
export const errorLogger = (error: Error, req: Request, _res: Response, next: NextFunction): void => {
  const errorLog = {
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: config.server.isDevelopment ? error.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: config.server.isDevelopment ? req.headers : {
        'user-agent': req.get('User-Agent'),
        'content-type': req.get('Content-Type'),
      },
      body: config.server.isDevelopment ? req.body : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error('🚨 Request Error:', JSON.stringify(errorLog, null, 2));
  next(error);
};