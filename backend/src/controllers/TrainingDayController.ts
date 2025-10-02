import { Request, Response } from 'express';
import { TrainingDayService } from '@/services/TrainingDayService';
import { asyncHandler } from '@/middleware/asyncHandler';
import { sendSuccess, sendError, sendNotFound } from '@/utils/responseFormatter';

/**
 * Training Day Controller
 * Handles HTTP requests for training days
 */
export class TrainingDayController {
  constructor(private service: TrainingDayService) {}

  /**
   * GET /api/v1/training-days?profile_id=X
   * Get all training days for a profile
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profileId = parseInt(req.query['profile_id'] as string);

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    const data = await this.service.getAllForProfile(profileId);
    sendSuccess(res, data);
  });

  /**
   * GET /api/v1/training-days/:id?profile_id=X
   * Get training day by ID with exercises
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);
    const profileId = parseInt(req.query['profile_id'] as string);

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    try {
      const data = await this.service.getByIdWithExercises(id, profileId);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error.message === 'Training day not found') {
        sendNotFound(res, 'Training day not found');
      } else {
        throw error;
      }
    }
  });

  /**
   * POST /api/v1/training-days
   * Create new training day
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { profile_id, name, description, exercises = [] } = req.body;

    try {
      const data = await this.service.create({
        profile_id,
        name,
        description,
        exercises
      });

      sendSuccess(res, data, 'Training day created successfully', 201);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        sendError(res, error.message, 409);
      } else if (error.message.includes('Invalid exercise IDs')) {
        sendError(res, error.message, 400);
      } else if (error.message.includes('required')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * PUT /api/v1/training-days/:id
   * Update training day
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);
    const { profile_id, name, description, exercises } = req.body;

    if (!profile_id) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    try {
      const data = await this.service.update(id, {
        profile_id,
        name,
        description,
        exercises
      });

      sendSuccess(res, data, 'Training day updated successfully');
    } catch (error: any) {
      if (error.message === 'Training day not found') {
        sendNotFound(res, 'Training day not found');
      } else if (error.message.includes('already exists')) {
        sendError(res, error.message, 409);
      } else if (error.message.includes('At least one exercise is required')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * DELETE /api/v1/training-days/:id?profile_id=X
   * Delete training day (soft delete)
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);
    const profileId = parseInt(req.query['profile_id'] as string);

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    try {
      await this.service.delete(id, profileId);
      sendSuccess(res, null, 'Training day deleted successfully');
    } catch (error: any) {
      if (error.message === 'Training day not found') {
        sendNotFound(res, 'Training day not found');
      } else {
        throw error;
      }
    }
  });
}
