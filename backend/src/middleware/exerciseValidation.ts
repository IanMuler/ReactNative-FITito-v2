import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate exercise creation data
 * Simple schema validation (name, image)
 */
export const validateExerciseCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { name, image } = req.body;

  const errors: string[] = [];

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!image || typeof image !== 'string' || image.trim().length === 0) {
    errors.push('Image is required');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Middleware to validate exercise update data
 * Simple schema validation (name, image)
 */
export const validateExerciseUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { name, image } = req.body;

  const errors: string[] = [];

  // Validate required fields (both are required for update)
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!image || typeof image !== 'string' || image.trim().length === 0) {
    errors.push('Image is required');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors
    });
    return;
  }

  next();
};