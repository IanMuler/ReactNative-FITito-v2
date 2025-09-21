import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

// Validation result handler
export const handleValidationErrors = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined,
    }));

    throw new AppError(
      'Validation failed',
      422,
      'VALIDATION_ERROR',
      { errors: formattedErrors }
    );
  }
  
  next();
};

// Common validation rules
export const commonValidations = {
  // ID validation (UUID format)
  id: () => param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID format'),

  // Email validation
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),

  // Password validation
  password: () => body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // Name validation
  name: (field: string = 'name') => body(field)
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(`${field} must be between 2 and 100 characters`)
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`),

  // Username validation
  username: () => body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],

  // Search query validation
  search: () => query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
};

// Exercise-specific validations
export const exerciseValidations = {
  create: () => [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Exercise name must be between 2 and 100 characters'),
    
    body('category')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('instructions')
      .optional()
      .isArray()
      .withMessage('Instructions must be an array'),
    
    body('instructions.*')
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Each instruction must be between 5 and 500 characters'),
    
    body('muscleGroups')
      .isArray({ min: 1 })
      .withMessage('At least one muscle group is required'),
    
    body('muscleGroups.*')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Each muscle group must be between 2 and 50 characters'),
  ],

  update: () => [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Exercise name must be between 2 and 100 characters'),
    
    body('category')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    
    body('instructions')
      .optional()
      .isArray()
      .withMessage('Instructions must be an array'),
    
    body('muscleGroups')
      .optional()
      .isArray({ min: 1 })
      .withMessage('At least one muscle group is required if provided'),
  ],
};

// User-specific validations
export const userValidations = {
  register: () => [
    commonValidations.email(),
    commonValidations.username(),
    commonValidations.password(),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
  ],

  login: () => [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Must be a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  updateProfile: () => [
    commonValidations.email().optional(),
    commonValidations.username().optional(),
  ],
};

// Create validation middleware chain
export const validate = (validations: ValidationChain[]) => {
  return [...validations, handleValidationErrors];
};