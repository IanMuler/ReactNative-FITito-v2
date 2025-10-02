/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors and pass them to error handling middleware
 */

import { Request, Response, NextFunction } from 'express';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Wraps async route handlers to automatically catch errors
 * @param fn - Async route handler function
 * @returns Wrapped function that catches errors
 */
export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
