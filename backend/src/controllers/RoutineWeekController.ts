import { Request, Response } from 'express';
import { RoutineWeekService } from '@/services/RoutineWeekService';
import { asyncHandler } from '@/middleware/asyncHandler';
import { sendSuccess, sendError, sendNotFound } from '@/utils/responseFormatter';

export class RoutineWeekController {
  constructor(private service: RoutineWeekService) {}

  /**
   * GET /api/v1/routine-weeks?profile_id=X
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
   * PUT /api/v1/routine-weeks/:id
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);

    try {
      const data = await this.service.update(id, req.body);
      sendSuccess(res, data, 'Routine week updated successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else if (error.message.includes('required') || error.message.includes('No fields')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * GET /api/v1/routine-weeks/:id/configuration
   */
  getConfiguration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);
    const profileId = parseInt(req.query['profile_id'] as string);

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    try {
      const data = await this.service.getConfiguration(id, profileId);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        throw error;
      }
    }
  });

  /**
   * PUT /api/v1/routine-weeks/:id/configuration
   */
  updateConfiguration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);

    try {
      const data = await this.service.updateConfiguration(id, req.body);
      sendSuccess(res, data, 'Routine day configuration updated successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else if (error.message.includes('required')) {
        sendError(res, error.message, 400);
      } else if (error.message.includes('Exercise with ID')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * DELETE /api/v1/routine-weeks/:id/configuration
   */
  deleteConfiguration = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);
    const profileId = parseInt(req.query['profile_id'] as string);

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    try {
      const deletedCount = await this.service.deleteConfiguration(id, profileId);
      sendSuccess(
        res,
        { deleted_count: deletedCount },
        'Routine day configuration deleted successfully'
      );
    } catch (error: any) {
      if (error.message.includes('not found')) {
        sendNotFound(res, error.message);
      } else {
        throw error;
      }
    }
  });
}
