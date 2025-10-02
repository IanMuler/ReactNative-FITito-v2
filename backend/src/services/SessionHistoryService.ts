/**
 * Session History Service
 *
 * Business logic layer for session history operations.
 * Validates data and coordinates repository calls.
 */

import { SessionHistoryRepository } from '@/repositories/SessionHistoryRepository';
import {
  SessionHistoryResponse,
  DetailedSessionHistoryResponse,
  CreateSessionHistoryDto,
  DeleteTodaySessionResult,
} from '@/types/session-history';

export class SessionHistoryService {
  private repository: SessionHistoryRepository;

  constructor() {
    this.repository = new SessionHistoryRepository();
  }

  /**
   * Upsert session history
   * Validates required fields and status values
   *
   * @param data - Session history data
   * @returns Session history ID
   * @throws Error if validation fails
   */
  async upsertSessionHistory(data: CreateSessionHistoryDto): Promise<number> {
    // Validate required fields
    this.validateRequiredFields(data);

    // Validate status
    if (!['completed', 'cancelled'].includes(data.status)) {
      throw new Error('Invalid status. Must be "completed" or "cancelled"');
    }

    // Validate date format (YYYY-MM-DD)
    if (!this.isValidDateFormat(data.session_date)) {
      throw new Error('Invalid session_date format. Expected YYYY-MM-DD');
    }

    return await this.repository.upsert(data);
  }

  /**
   * Get session history for profile
   * Checks if date filter is provided and routes to appropriate method
   *
   * @param profileId - Profile ID
   * @param limit - Maximum records to return
   * @param date - Optional date filter (YYYY-MM-DD)
   * @returns Session history records
   */
  async getSessionHistory(
    profileId: number,
    limit: number = 50,
    date?: string
  ): Promise<SessionHistoryResponse[] | DetailedSessionHistoryResponse[]> {
    if (!profileId || profileId <= 0) {
      throw new Error('Invalid profile_id');
    }

    if (date) {
      // Validate date format
      if (!this.isValidDateFormat(date)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }

      return await this.repository.getByDate(profileId, date);
    }

    // Validate limit
    if (limit <= 0 || limit > 1000) {
      throw new Error('Invalid limit. Must be between 1 and 1000');
    }

    return await this.repository.getAll(profileId, limit);
  }

  /**
   * Get specific session history by ID
   *
   * @param id - Session history ID
   * @param profileId - Profile ID for validation
   * @returns Detailed session history
   * @throws Error if not found
   */
  async getSessionHistoryById(
    id: number,
    profileId: number
  ): Promise<DetailedSessionHistoryResponse> {
    if (!id || id <= 0) {
      throw new Error('Invalid session history ID');
    }

    if (!profileId || profileId <= 0) {
      throw new Error('Invalid profile_id');
    }

    const sessionHistory = await this.repository.getById(id, profileId);

    if (!sessionHistory) {
      throw new Error('Session history not found');
    }

    return sessionHistory;
  }

  /**
   * Delete session history by ID
   *
   * @param id - Session history ID
   * @param profileId - Profile ID for validation
   * @returns Deleted session info
   * @throws Error if not found
   */
  async deleteSessionHistory(id: number, profileId: number): Promise<SessionHistoryResponse> {
    if (!id || id <= 0) {
      throw new Error('Invalid session history ID');
    }

    if (!profileId || profileId <= 0) {
      throw new Error('Invalid profile_id');
    }

    return await this.repository.deleteById(id, profileId);
  }

  /**
   * Delete today's session history and reset completed status
   *
   * @param profileId - Profile ID
   * @param date - Date to delete (must be today)
   * @returns Deleted session info
   * @throws Error if date is not today or validation fails
   */
  async deleteTodaySession(
    profileId: number,
    date: string
  ): Promise<DeleteTodaySessionResult> {
    if (!profileId || profileId <= 0) {
      throw new Error('Invalid profile_id');
    }

    if (!date) {
      throw new Error('Date is required');
    }

    // Validate date format
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    // Validate that the date is today
    const today = new Date().toISOString().split('T')[0];
    if (date !== today) {
      throw new Error('Can only delete history for today. Past history cannot be deleted.');
    }

    return await this.repository.deleteTodayAndResetCompleted(profileId, date);
  }

  /**
   * Delete session history by date (any date, not just today)
   *
   * @param profileId - Profile ID
   * @param date - Date to delete (YYYY-MM-DD)
   * @returns Deleted session info
   * @throws Error if not found or validation fails
   */
  async deleteSessionByDate(
    profileId: number,
    date: string
  ): Promise<DeleteTodaySessionResult> {
    if (!profileId || profileId <= 0) {
      throw new Error('Invalid profile_id');
    }

    if (!date) {
      throw new Error('Date is required');
    }

    // Validate date format
    if (!this.isValidDateFormat(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    return await this.repository.deleteByDate(profileId, date);
  }

  /**
   * Validate required fields for session history creation
   */
  private validateRequiredFields(data: CreateSessionHistoryDto): void {
    const requiredFields = [
      'profile_id',
      'session_date',
      'session_uuid',
      'routine_name',
      'day_name',
      'status',
      'start_time',
      'end_time',
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = data[field as keyof CreateSessionHistoryDto];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }

    // Validate it's a real date
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }
}
