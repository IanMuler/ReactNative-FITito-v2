/**
 * Session History Repository
 *
 * Data access layer for session history operations.
 * Uses stored functions for upsert and retrieval operations.
 */


import { ProfileAwareRepository } from './BaseRepository';
import {
  SessionHistory,
  SessionHistoryResponse,
  DetailedSessionHistoryResponse,
  CreateSessionHistoryDto,
  SessionData,
  DeleteTodaySessionResult,
} from '@/types/session-history';

export class SessionHistoryRepository extends ProfileAwareRepository<SessionHistory> {
  protected tableName = 'session_history';
  protected primaryKey = 'id';

  /**
   * Upsert session history (insert or update)
   * Uses upsert_session_history() stored function
   *
   * @param data - Session history data
   * @returns Inserted/updated session history ID
   */
  async upsert(data: CreateSessionHistoryDto): Promise<number> {
    try {
      const result = await this.executeQuery<{ id: number }>(
        `SELECT upsert_session_history($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) as id`,
        [
          data.profile_id,
          data.session_date,
          data.session_uuid,
          data.routine_name,
          data.day_name,
          data.status,
          data.start_time,
          data.end_time,
          data.duration_minutes || 0,
          JSON.stringify(data.session_data || {}),
          data.notes || null,
          data.total_exercises || 0,
          data.completed_exercises || 0,
          data.total_sets || 0,
          data.completed_sets || 0,
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to upsert session history');
      }

      return result.rows[0]!['id'];
    } catch (error) {
      throw this.handleDatabaseError(error, 'upsert');
    }
  }

  /**
   * Get session history for profile (paginated or all)
   * Uses get_session_history() stored function
   *
   * @param profileId - Profile ID
   * @param limit - Maximum number of records to return
   * @returns Array of session history records (without session_data)
   */
  async getAll(profileId: number, limit: number = 50): Promise<SessionHistoryResponse[]> {
    try {
      const result = await this.executeQuery<SessionHistoryResponse>(
        `SELECT * FROM get_session_history($1, $2)`,
        [profileId, limit]
      );

      return result.rows;
    } catch (error) {
      throw this.handleDatabaseError(error, 'getAll');
    }
  }

  /**
   * Get session history by specific date
   * Uses get_session_history_by_date() stored function
   *
   * @param profileId - Profile ID
   * @param date - Date in YYYY-MM-DD format
   * @returns Array of session history records for the date (with session_data)
   */
  async getByDate(profileId: number, date: string): Promise<DetailedSessionHistoryResponse[]> {
    try {
      const result = await this.executeQuery<DetailedSessionHistoryResponse>(
        `SELECT * FROM get_session_history_by_date($1, $2)`,
        [profileId, date]
      );

      return result.rows;
    } catch (error) {
      throw this.handleDatabaseError(error, 'getByDate');
    }
  }

  /**
   * Get specific session history by ID
   * Returns full session data including session_data JSONB
   *
   * @param id - Session history ID
   * @param profileId - Profile ID for validation
   * @returns Detailed session history or null if not found
   */
  async getById(id: number, profileId: number): Promise<DetailedSessionHistoryResponse | null> {
    try {
      const result = await this.executeQuery<any>(
        `SELECT
          id,
          session_date,
          session_uuid,
          routine_name,
          day_name,
          status,
          start_time,
          end_time,
          duration_minutes,
          session_data,
          total_exercises,
          completed_exercises,
          total_sets,
          completed_sets,
          notes,
          created_at,
          updated_at
        FROM ${this.tableName}
        WHERE id = $1 AND profile_id = $2`,
        [id, profileId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0]!;

      return {
        id: row['id'],
        session_date: row['session_date'],
        session_uuid: row['session_uuid'],
        routine_name: row['routine_name'],
        day_name: row['day_name'],
        status: row['status'],
        start_time: row['start_time'],
        end_time: row['end_time'],
        duration_minutes: row['duration_minutes'],
        session_data: row['session_data'] as SessionData,
        total_exercises: row['total_exercises'],
        completed_exercises: row['completed_exercises'],
        total_sets: row['total_sets'],
        completed_sets: row['completed_sets'],
        notes: row['notes'],
        created_at: row['created_at'],
        updated_at: row['updated_at'],
      };
    } catch (error) {
      throw this.handleDatabaseError(error, 'getById');
    }
  }

  /**
   * Delete session history by ID
   *
   * @param id - Session history ID
   * @param profileId - Profile ID for validation
   * @returns Deleted session history info
   * @throws Error if session not found
   */
  async deleteById(id: number, profileId: number): Promise<SessionHistoryResponse> {
    try {
      const result = await this.executeQuery<any>(
        `DELETE FROM ${this.tableName}
        WHERE id = $1 AND profile_id = $2
        RETURNING id, routine_name, session_date, day_name, status,
                  start_time, end_time, duration_minutes,
                  total_exercises, completed_exercises, total_sets, completed_sets,
                  notes, created_at`,
        [id, profileId]
      );

      if (result.rows.length === 0) {
        throw new Error('Session history not found');
      }

      const row = result.rows[0]!;

      return {
        id: row['id'],
        session_date: row['session_date'],
        routine_name: row['routine_name'],
        day_name: row['day_name'],
        status: row['status'],
        start_time: row['start_time'],
        end_time: row['end_time'],
        duration_minutes: row['duration_minutes'],
        total_exercises: row['total_exercises'],
        completed_exercises: row['completed_exercises'],
        total_sets: row['total_sets'],
        completed_sets: row['completed_sets'],
        notes: row['notes'],
        created_at: row['created_at'],
      };
    } catch (error) {
      throw this.handleDatabaseError(error, 'delete');
    }
  }

  /**
   * Delete today's session history
   * Transaction-based operation
   *
   * @param profileId - Profile ID
   * @param date - Date to delete (must be today)
   * @returns Deleted session info
   * @throws Error if date is not today or session not found
   */
  async deleteTodayAndResetCompleted(
    profileId: number,
    date: string
  ): Promise<DeleteTodaySessionResult> {
    return this.executeTransaction(async (client) => {
      // Validate that the date is today
      const today = new Date().toISOString().split('T')[0];
      if (date !== today) {
        throw new Error('Can only delete history for today');
      }

      // Delete session history for today
      const deleteResult = await client.query(
        `DELETE FROM ${this.tableName}
        WHERE profile_id = $1 AND session_date = $2
        RETURNING id, routine_name, day_name, session_date`,
        [profileId, date]
      );

      if (deleteResult.rows.length === 0) {
        throw new Error('No session history found for today');
      }

      const deletedSession = deleteResult.rows[0]!;

      return {
        id: deletedSession['id'],
        routine_name: deletedSession['routine_name'],
        day_name: deletedSession['day_name'],
        session_date: deletedSession['session_date'],
      };
    });
  }

  /**
   * Delete session history by date (any date, not just today)
   *
   * @param profileId - Profile ID
   * @param date - Date to delete (YYYY-MM-DD format)
   * @returns Deleted session info
   * @throws Error if session not found
   */
  async deleteByDate(
    profileId: number,
    date: string
  ): Promise<DeleteTodaySessionResult> {
    try {
      const deleteResult = await this.executeQuery<any>(
        `DELETE FROM ${this.tableName}
        WHERE profile_id = $1 AND session_date = $2
        RETURNING id, routine_name, day_name, session_date`,
        [profileId, date]
      );

      if (deleteResult.rows.length === 0) {
        throw new Error('No session history found for this date');
      }

      const deletedSession = deleteResult.rows[0]!;

      return {
        id: deletedSession['id'],
        routine_name: deletedSession['routine_name'],
        day_name: deletedSession['day_name'],
        session_date: deletedSession['session_date'],
      };
    } catch (error) {
      throw this.handleDatabaseError(error, 'deleteByDate');
    }
  }
}
