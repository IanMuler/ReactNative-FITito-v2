import { Request, Response, NextFunction } from 'express';
import { ApiError, ApiResponse } from '@/types/common';
import { config } from '@/config/environment';

// Custom error class
export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    if (code) this.code = code;
    if (details) this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error creators
export const createError = {
  badRequest: (message: string, details?: Record<string, any>) =>
    new AppError(message, 400, 'BAD_REQUEST', details),
  
  unauthorized: (message: string = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN'),
  
  notFound: (message: string = 'Resource not found') =>
    new AppError(message, 404, 'NOT_FOUND'),
  
  conflict: (message: string, details?: Record<string, any>) =>
    new AppError(message, 409, 'CONFLICT', details),
  
  validation: (message: string, details?: Record<string, any>) =>
    new AppError(message, 422, 'VALIDATION_ERROR', details),
  
  internal: (message: string = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),
};

// Global error handler middleware
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details: Record<string, any> | undefined;

  // Handle our custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
    details = error.details;
  }
  // Handle validation errors from express-validator
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = { validationErrors: error.message };
  }
  // Handle other known error types
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  }
  else if (error.name === 'MongoError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    code = 'DUPLICATE_FIELD';
  }

  // Log error in development
  if (config.server.isDevelopment) {
    console.error('❌ Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }

  // Create error response
  const errorResponse: ApiResponse = {
    success: false,
    error: message,
    message: `${code}: ${message}`,
    timestamp: new Date().toISOString(),
  };

  // Include details and stack trace in development
  if (config.server.isDevelopment) {
    errorResponse.data = {
      code,
      details,
      stack: error.stack,
    };
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    message: 'NOT_FOUND: The requested resource was not found',
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};