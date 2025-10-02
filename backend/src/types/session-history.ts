/**
 * Session History Types
 *
 * Types for session history tracking, including completed workout sessions
 * and historical workout data in AsyncStorage format.
 */

/**
 * Session History entity from database
 */
export interface SessionHistory {
  id: number;
  profile_id: number;
  session_date: string; // DATE format: YYYY-MM-DD
  session_uuid: string;
  routine_name: string;
  day_name: string;
  status: 'completed' | 'cancelled';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  session_data: SessionData;
  notes: string | null;
  total_exercises: number;
  completed_exercises: number;
  total_sets: number;
  completed_sets: number;
  created_at: string;
  updated_at: string;
}

/**
 * Session Data JSONB structure
 * Contains complete exercise data for a training session
 */
export interface SessionData {
  exercises: Array<{
    exercise_id: number;
    exercise_name: string;
    exercise_image?: string;
    order_in_session: number;
    sets_config: any[];
    performed_sets: any[];
    is_completed: boolean;
    notes?: string;
  }>;
  total_exercises?: number;
  completed_exercises?: number;
  total_sets?: number;
  completed_sets?: number;
}

/**
 * Session History response (list view)
 * Excludes session_data for performance
 */
export interface SessionHistoryResponse {
  id: number;
  session_date: string;
  routine_name: string;
  day_name: string;
  status: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_exercises: number;
  completed_exercises: number;
  total_sets: number;
  completed_sets: number;
  notes: string | null;
  created_at: string;
}

/**
 * Detailed Session History response (single view)
 * Includes full session_data
 */
export interface DetailedSessionHistoryResponse extends SessionHistoryResponse {
  session_uuid: string;
  session_data: SessionData;
  updated_at: string;
}

/**
 * Create/Update Session History DTO
 */
export interface CreateSessionHistoryDto {
  profile_id: number;
  session_date: string; // YYYY-MM-DD
  session_uuid: string;
  routine_name: string;
  day_name: string;
  status: 'completed' | 'cancelled';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  session_data: SessionData;
  notes?: string;
  total_exercises?: number;
  completed_exercises?: number;
  total_sets?: number;
  completed_sets?: number;
}

/**
 * Workout History Entry (AsyncStorage legacy format)
 */
export interface WorkoutHistoryEntry {
  name: string;
  image: string;
  sets: Array<{
    reps: string;
    weight: string;
    rir?: string;
  }>;
  performedSets: Array<{
    reps: string;
    weight: string;
    rir?: string;
    isCompleted?: boolean;
    notes?: string;
  }>;
}

/**
 * Legacy History Response (AsyncStorage format)
 * Used by mobile app for backward compatibility
 */
export interface LegacyHistoryResponse {
  date: string; // DD/MM/YYYY format
  exerciseDetails: WorkoutHistoryEntry[];
}

/**
 * Delete Today Session Result
 */
export interface DeleteTodaySessionResult {
  id: number;
  routine_name: string;
  day_name: string;
  session_date: string;
}
