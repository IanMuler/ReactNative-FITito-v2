import { Request, Response } from 'express';
import { ExerciseService } from '../services/exerciseService';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess, sendError, sendNotFound } from '../utils/responseFormatter';

/**
 * Exercise Controller
 * Handles HTTP requests for exercises with simple schema (id, name, image, created_at)
 */
export class ExerciseController {
  constructor(private service: ExerciseService) {}

  /**
   * GET /api/v1/exercises
   * Get all exercises
   */
  getAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const data = await this.service.getAll();
    sendSuccess(res, data);
  });

  /**
   * GET /api/v1/exercises/:id
   * Get exercise by ID
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);

    try {
      const data = await this.service.getById(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error.message === 'Exercise not found') {
        sendNotFound(res, 'Exercise not found');
      } else {
        throw error;
      }
    }
  });

  /**
   * POST /api/v1/exercises
   * Create new exercise
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, image } = req.body;

    try {
      const data = await this.service.create({ name, image });
      sendSuccess(res, data, 'Exercise created successfully', 201);
    } catch (error: any) {
      if (error.message.includes('required')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * PUT /api/v1/exercises/:id
   * Update exercise
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);
    const { name, image } = req.body;

    try {
      const data = await this.service.update(id, { name, image });
      sendSuccess(res, data, 'Exercise updated successfully');
    } catch (error: any) {
      if (error.message === 'Exercise not found') {
        sendNotFound(res, 'Exercise not found');
      } else if (error.message.includes('required')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * DELETE /api/v1/exercises/:id
   * Delete exercise (hard delete)
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);

    try {
      await this.service.delete(id);
      sendSuccess(res, null, 'Exercise deleted successfully');
    } catch (error: any) {
      if (error.message === 'Exercise not found') {
        sendNotFound(res, 'Exercise not found');
      } else {
        throw error;
      }
    }
  });
}