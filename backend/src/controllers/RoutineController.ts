import { Request, Response } from 'express';
import { RoutineService } from '@/services/RoutineService';
import { asyncHandler } from '@/middleware/asyncHandler';
import { sendSuccess, sendError, sendNotFound } from '@/utils/responseFormatter';

/**
 * Routine Controller
 * Handles HTTP requests for routines
 */
export class RoutineController {
  constructor(private service: RoutineService) {}

  /**
   * GET /api/v1/routines?profile_id=X
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
   * GET /api/v1/routines/:id?profile_id=X
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
      if (error.message === 'Routine not found') {
        sendNotFound(res, 'Routine not found');
      } else {
        throw error;
      }
    }
  });

  /**
   * POST /api/v1/routines
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.service.create(req.body);
      sendSuccess(res, data, 'Routine created successfully', 201);
    } catch (error: any) {
      if (error.message.includes('Invalid exercise IDs')) {
        sendError(res, error.message, 400);
      } else if (error.message.includes('required')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * PUT /api/v1/routines/:id
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);

    try {
      const data = await this.service.update(id, req.body);
      sendSuccess(res, data, 'Routine updated successfully');
    } catch (error: any) {
      if (error.message === 'Routine not found') {
        sendNotFound(res, 'Routine not found');
      } else if (error.message.includes('At least one exercise is required')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * DELETE /api/v1/routines/:id?profile_id=X
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
      sendSuccess(res, null, 'Routine deleted successfully');
    } catch (error: any) {
      if (error.message === 'Routine not found') {
        sendNotFound(res, 'Routine not found');
      } else {
        throw error;
      }
    }
  });
}
