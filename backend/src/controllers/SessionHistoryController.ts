/**
 * Session History Controller
 *
 * Handles HTTP requests for session history operations.
 * Coordinates between request/response and service layer.
 */

import { Request, Response } from 'express';
import { SessionHistoryService } from '@/services/SessionHistoryService';
import { asyncHandler } from '@/middleware/asyncHandler';
import { sendSuccess, sendError, sendNotFound } from '@/utils/responseFormatter';
import { CreateSessionHistoryDto } from '@/types/session-history';

export class SessionHistoryController {
  constructor(private service: SessionHistoryService) {}

  /**
   * POST /api/v1/session-history
   * Upsert session history (insert or update)
   */
  upsert = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const data: CreateSessionHistoryDto = req.body;
      const sessionId = await this.service.upsertSessionHistory(data);

      sendSuccess(
        res,
        {
          id: sessionId,
          profile_id: data.profile_id,
          session_date: data.session_date,
          status: data.status,
        },
        'Session history saved successfully',
        200
      );
    } catch (error: any) {
      if (
        error.message.includes('Missing required fields') ||
        error.message.includes('Invalid status') ||
        error.message.includes('Invalid session_date format')
      ) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * GET /api/v1/session-history?profile_id=X&limit=Y&date=YYYY-MM-DD
   * Get session history (all or filtered by date)
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profileId = parseInt(req.query['profile_id'] as string);
    const limit = parseInt(req.query['limit'] as string) || 50;
    const date = req.query['date'] as string | undefined;

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    try {
      const data = await this.service.getSessionHistory(profileId, limit, date);
      sendSuccess(
        res,
        data,
        undefined,
        200,
        { count: data.length }
      );
    } catch (error: any) {
      if (
        error.message.includes('Invalid profile_id') ||
        error.message.includes('Invalid date format') ||
        error.message.includes('Invalid limit')
      ) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * GET /api/v1/session-history/:id?profile_id=X
   * Get specific session history with full data
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);
    const profileId = parseInt(req.query['profile_id'] as string);

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    if (!id || isNaN(id)) {
      sendError(res, 'Invalid session history ID', 400);
      return;
    }

    try {
      const data = await this.service.getSessionHistoryById(id, profileId);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error.message === 'Session history not found') {
        sendNotFound(res, 'Session history not found');
      } else if (error.message.includes('Invalid')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * DELETE /api/v1/session-history/:id?profile_id=X
   * Delete specific session history
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params['id'] as string);
    const profileId = parseInt(req.query['profile_id'] as string);

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    if (!id || isNaN(id)) {
      sendError(res, 'Invalid session history ID', 400);
      return;
    }

    try {
      const deletedSession = await this.service.deleteSessionHistory(id, profileId);
      sendSuccess(res, deletedSession, 'Session history deleted successfully');
    } catch (error: any) {
      if (error.message === 'Session history not found') {
        sendNotFound(res, 'Session history not found');
      } else if (error.message.includes('Invalid')) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * DELETE /api/v1/session-history/today?profile_id=X&date=YYYY-MM-DD
   * Delete today's session history
   */
  deleteToday = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profileId = parseInt(req.query['profile_id'] as string);
    const date = req.query['date'] as string;

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    if (!date) {
      sendError(res, 'date is required', 400);
      return;
    }

    try {
      const deletedSession = await this.service.deleteTodaySession(profileId, date);
      sendSuccess(
        res,
        deletedSession,
        "Today's session history deleted and completed date reset successfully"
      );
    } catch (error: any) {
      if (error.message === 'No session history found for today') {
        sendNotFound(res, 'No session history found for today');
      } else if (error.message.includes('Can only delete history for today')) {
        sendError(res, error.message, 403);
      } else if (
        error.message.includes('Invalid') ||
        error.message.includes('required')
      ) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });

  /**
   * DELETE /api/v1/session-history/date?profile_id=X&date=YYYY-MM-DD
   * Delete session history by date (any date)
   */
  deleteByDate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profileId = parseInt(req.query['profile_id'] as string);
    const date = req.query['date'] as string;

    if (!profileId || isNaN(profileId)) {
      sendError(res, 'profile_id is required', 400);
      return;
    }

    if (!date) {
      sendError(res, 'date is required', 400);
      return;
    }

    try {
      const deletedSession = await this.service.deleteSessionByDate(profileId, date);
      sendSuccess(
        res,
        deletedSession,
        'Session history deleted successfully'
      );
    } catch (error: any) {
      if (error.message === 'No session history found for this date') {
        sendNotFound(res, 'No session history found for this date');
      } else if (
        error.message.includes('Invalid') ||
        error.message.includes('required')
      ) {
        sendError(res, error.message, 400);
      } else {
        throw error;
      }
    }
  });
}
