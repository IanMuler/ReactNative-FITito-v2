import { Request, Response, NextFunction } from 'express';
import { ExerciseCategory } from '../types/exercise';

/**
 * Middleware to validate exercise creation data
 */
export const validateExerciseCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { name, category, muscle_groups, difficulty_level, video_url, image_url } = req.body;

  const errors: string[] = [];

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long');
  }

  if (!category || !Object.values(ExerciseCategory).includes(category)) {
    errors.push(`Category is required and must be one of: ${Object.values(ExerciseCategory).join(', ')}`);
  }

  if (!muscle_groups || !Array.isArray(muscle_groups) || muscle_groups.length === 0) {
    errors.push('At least one muscle group is required');
  }

  // Validate optional fields
  if (difficulty_level !== undefined) {
    const level = parseInt(difficulty_level);
    if (isNaN(level) || level < 1 || level > 5) {
      errors.push('Difficulty level must be a number between 1 and 5');
    }
  }

  if (video_url && typeof video_url === 'string' && !isValidUrl(video_url)) {
    errors.push('Video URL must be a valid HTTP/HTTPS URL');
  }

  if (image_url && typeof image_url === 'string' && !isValidUrl(image_url)) {
    errors.push('Image URL must be a valid HTTP/HTTPS URL');
  }

  // Validate arrays
  const arrayFields = ['muscle_groups', 'equipment', 'instructions', 'tips', 'common_mistakes', 'variations'];
  arrayFields.forEach(field => {
    if (req.body[field] !== undefined && !Array.isArray(req.body[field])) {
      errors.push(`${field} must be an array`);
    }
  });

  // Validate booleans
  const booleanFields = ['is_compound', 'is_bodyweight', 'is_active', 'created_by_admin'];
  booleanFields.forEach(field => {
    if (req.body[field] !== undefined && typeof req.body[field] !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }
  });

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
 */
export const validateExerciseUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { name, category, muscle_groups, difficulty_level, video_url, image_url } = req.body;

  const errors: string[] = [];

  // Validate optional fields (since it's an update)
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters long');
  }

  if (category !== undefined && !Object.values(ExerciseCategory).includes(category)) {
    errors.push(`Category must be one of: ${Object.values(ExerciseCategory).join(', ')}`);
  }

  if (muscle_groups !== undefined && (!Array.isArray(muscle_groups) || muscle_groups.length === 0)) {
    errors.push('At least one muscle group is required');
  }

  if (difficulty_level !== undefined) {
    const level = parseInt(difficulty_level);
    if (isNaN(level) || level < 1 || level > 5) {
      errors.push('Difficulty level must be a number between 1 and 5');
    }
  }

  if (video_url !== undefined && video_url !== null && typeof video_url === 'string' && !isValidUrl(video_url)) {
    errors.push('Video URL must be a valid HTTP/HTTPS URL');
  }

  if (image_url !== undefined && image_url !== null && typeof image_url === 'string' && !isValidUrl(image_url)) {
    errors.push('Image URL must be a valid HTTP/HTTPS URL');
  }

  // Validate arrays
  const arrayFields = ['muscle_groups', 'equipment', 'instructions', 'tips', 'common_mistakes', 'variations'];
  arrayFields.forEach(field => {
    if (req.body[field] !== undefined && !Array.isArray(req.body[field])) {
      errors.push(`${field} must be an array`);
    }
  });

  // Validate booleans
  const booleanFields = ['is_compound', 'is_bodyweight', 'is_active'];
  booleanFields.forEach(field => {
    if (req.body[field] !== undefined && typeof req.body[field] !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }
  });

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
 * Helper function to validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return /^https?:\/\/.+/.test(url);
  } catch {
    return false;
  }
}

/**
 * Middleware to validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { limit, offset } = req.query;

  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
        message: 'Limit must be a number between 1 and 100'
      });
      return;
    }
  }

  if (offset !== undefined) {
    const offsetNum = parseInt(offset as string);
    if (isNaN(offsetNum) || offsetNum < 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid offset parameter',
        message: 'Offset must be a non-negative number'
      });
      return;
    }
  }

  next();
};