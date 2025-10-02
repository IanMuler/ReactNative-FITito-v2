/**
 * Response Formatter Utility
 * Provides consistent response format across all API endpoints
 */

import { Response } from 'express';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Format success response
 */
export function formatSuccess<T>(
  data: T,
  message?: string,
  metadata?: ApiSuccessResponse['metadata']
): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (metadata) {
    response.metadata = metadata;
  }

  return response;
}

/**
 * Format error response
 */
export function formatError(
  error: string,
  message: string,
  details?: any
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    error,
    message,
  };

  if (details && process.env['NODE_ENV'] !== 'production') {
    response.details = details;
  }

  return response;
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  metadata?: ApiSuccessResponse['metadata']
): void {
  res.status(statusCode).json(formatSuccess(data, message, metadata));
}

/**
 * Send error response
 * Overloaded to accept (res, message, statusCode) or (res, error, message, statusCode, details)
 */
export function sendError(
  res: Response,
  errorOrMessage: string,
  statusCodeOrMessage?: number | string,
  statusCodeOrDetails?: number | any,
  details?: any
): void {
  // If called with (res, message, statusCode)
  if (typeof statusCodeOrMessage === 'number') {
    const statusCode = statusCodeOrMessage;
    res.status(statusCode).json(formatError('Error', errorOrMessage, undefined));
  }
  // If called with (res, error, message, statusCode, details)
  else {
    const message = statusCodeOrMessage as string;
    const statusCode = (statusCodeOrDetails as number) || 500;
    res.status(statusCode).json(formatError(errorOrMessage, message, details));
  }
}

/**
 * Send created response (201)
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void {
  sendSuccess(res, data, message, 201);
}

/**
 * Send no content response (204)
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Send not found response (404)
 */
export function sendNotFound(
  res: Response,
  message: string = 'Resource not found'
): void {
  sendError(res, 'Not Found', message, 404);
}

/**
 * Send bad request response (400)
 */
export function sendBadRequest(
  res: Response,
  message: string,
  details?: any
): void {
  sendError(res, 'Bad Request', message, 400, details);
}

/**
 * Send internal server error response (500)
 */
export function sendInternalError(
  res: Response,
  message: string = 'Internal server error',
  details?: any
): void {
  sendError(res, 'Internal Server Error', message, 500, details);
}
