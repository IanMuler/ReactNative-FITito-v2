import { TrainingSession } from '../types';

// Use environment variable for API URL, fallback to local development URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.50:3000/api/v1';

export interface SessionHistoryRequest {
  profile_id: number;
  session_date: string; // YYYY-MM-DD format
  session_uuid: string;
  routine_name: string;
  day_name: string;
  status: 'completed' | 'cancelled';
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  duration_minutes: number;
  session_data: {
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
  };
  notes?: string;
  total_exercises?: number;
  completed_exercises?: number;
  total_sets?: number;
  completed_sets?: number;
}

export interface SessionHistoryResponse {
  id: number;
  session_date: string;
  routine_name: string;
  day_name: string;
  status: 'completed' | 'cancelled';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_exercises: number;
  completed_exercises: number;
  total_sets: number;
  completed_sets: number;
  notes?: string;
  created_at: string;
}

export interface DetailedSessionHistoryResponse extends SessionHistoryResponse {
  session_uuid: string;
  session_data: any;
  updated_at: string;
}

export class SessionHistoryApi {
  
  // Convert TrainingSession to SessionHistoryRequest
  static convertTrainingSessionToHistoryRequest(
    session: TrainingSession,
    profileId: number,
    endTime: string = new Date().toISOString()
  ): SessionHistoryRequest {
    // Usar componentes de fecha local en lugar de ISO UTC
    const startDate = new Date(session.start_time);
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const sessionDate = `${year}-${month}-${day}`; // YYYY-MM-DD format

    const startTime = new Date(session.start_time);
    const endTimeDate = new Date(endTime);
    const durationMinutes = Math.max(1, Math.floor((endTimeDate.getTime() - startTime.getTime()) / (1000 * 60)));

    const totalExercises = session.exercises.length;
    const completedExercises = session.exercises.filter(ex => ex.is_completed).length;
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets_config.length, 0);
    const completedSets = session.exercises.reduce(
      (sum, ex) => sum + ex.performed_sets.filter(set => set.is_completed).length, 
      0
    );

    return {
      profile_id: profileId,
      session_date: sessionDate,
      session_uuid: session.id,
      routine_name: session.routine_name,
      day_name: session.day_name,
      status: session.status as 'completed' | 'cancelled',
      start_time: session.start_time,
      end_time: endTime,
      duration_minutes: durationMinutes,
      session_data: {
        exercises: session.exercises.map(exercise => ({
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercise_name,
          exercise_image: exercise.exercise_image,
          order_in_session: exercise.order_in_session,
          sets_config: exercise.sets_config,
          performed_sets: exercise.performed_sets,
          is_completed: exercise.is_completed,
          notes: exercise.notes,
        })),
        total_exercises: totalExercises,
        completed_exercises: completedExercises,
        total_sets: totalSets,
        completed_sets: completedSets,
      },
      notes: session.notes,
      total_exercises: totalExercises,
      completed_exercises: completedExercises,
      total_sets: totalSets,
      completed_sets: completedSets,
    };
  }

  // Create or update session history
  static async syncSessionHistory(request: SessionHistoryRequest): Promise<{ id: number; profile_id: number; session_date: string; status: string }> {
    try {
      console.log('📚 [SessionHistoryApi] Syncing session to database:', {
        profile_id: request.profile_id,
        session_date: request.session_date,
        routine_name: request.routine_name,
        status: request.status,
        duration_minutes: request.duration_minutes
      });

      const response = await fetch(`${API_BASE_URL}/session-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [SessionHistoryApi] Session synced successfully:', {
        id: result.data.id,
        session_date: result.data.session_date,
        status: result.data.status
      });

      return result.data;
    } catch (error) {
      console.error('❌ [SessionHistoryApi] Error syncing session history:', error);
      throw error;
    }
  }

  // Get session history for profile
  static async getSessionHistory(profileId: number, limit: number = 50): Promise<SessionHistoryResponse[]> {
    try {
      console.log('📚 [SessionHistoryApi] Getting session history:', {
        profile_id: profileId,
        limit
      });

      const response = await fetch(`${API_BASE_URL}/session-history?profile_id=${profileId}&limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [SessionHistoryApi] Retrieved session history:', {
        profile_id: profileId,
        count: result.count
      });

      return result.data;
    } catch (error) {
      console.error('❌ [SessionHistoryApi] Error getting session history:', error);
      throw error;
    }
  }

  // Get session history for specific date
  static async getSessionHistoryByDate(profileId: number, date: string): Promise<DetailedSessionHistoryResponse | null> {
    try {
      console.log('📚 [SessionHistoryApi] Getting session history by date:', {
        profile_id: profileId,
        date
      });

      const response = await fetch(`${API_BASE_URL}/session-history?profile_id=${profileId}&date=${date}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [SessionHistoryApi] Retrieved session history by date:', {
        profile_id: profileId,
        date,
        found: result.data.length > 0
      });

      return result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error('❌ [SessionHistoryApi] Error getting session history by date:', error);
      throw error;
    }
  }

  // Get specific session history with full data
  static async getSessionHistoryDetails(sessionId: number, profileId: number): Promise<DetailedSessionHistoryResponse> {
    try {
      console.log('📚 [SessionHistoryApi] Getting session history details:', {
        session_id: sessionId,
        profile_id: profileId
      });

      const response = await fetch(`${API_BASE_URL}/session-history/${sessionId}?profile_id=${profileId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [SessionHistoryApi] Retrieved session history details:', {
        session_id: sessionId,
        routine_name: result.data.routine_name,
        status: result.data.status
      });

      return result.data;
    } catch (error) {
      console.error('❌ [SessionHistoryApi] Error getting session history details:', error);
      throw error;
    }
  }

  // Delete session history
  static async deleteSessionHistory(sessionId: number, profileId: number): Promise<void> {
    try {
      console.log('📚 [SessionHistoryApi] Deleting session history:', {
        session_id: sessionId,
        profile_id: profileId
      });

      const response = await fetch(`${API_BASE_URL}/session-history/${sessionId}?profile_id=${profileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('✅ [SessionHistoryApi] Session history deleted successfully:', {
        session_id: sessionId,
        routine_name: result.data.routine_name
      });
    } catch (error) {
      console.error('❌ [SessionHistoryApi] Error deleting session history:', error);
      throw error;
    }
  }

  // Delete today's session history and reset completed_date
  static async deleteTodaySessionHistory(profileId: number, date: string): Promise<void> {
    try {
      console.log('📚 [SessionHistoryApi] Deleting today\'s session history:', {
        profile_id: profileId,
        date
      });

      const response = await fetch(`${API_BASE_URL}/session-history/today?profile_id=${profileId}&date=${date}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('✅ [SessionHistoryApi] Today\'s session history deleted successfully:', {
        routine_name: result.data.routine_name,
        session_date: result.data.session_date
      });
    } catch (error) {
      console.error('❌ [SessionHistoryApi] Error deleting today\'s session history:', error);
      throw error;
    }
  }

  // Delete session history by date (any date)
  static async deleteSessionHistoryByDate(profileId: number, date: string): Promise<void> {
    try {
      console.log('📚 [SessionHistoryApi] Deleting session history by date:', {
        profile_id: profileId,
        date
      });

      const response = await fetch(`${API_BASE_URL}/session-history/date?profile_id=${profileId}&date=${date}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('✅ [SessionHistoryApi] Session history deleted successfully:', {
        routine_name: result.data.routine_name,
        session_date: result.data.session_date
      });
    } catch (error) {
      console.error('❌ [SessionHistoryApi] Error deleting session history by date:', error);
      throw error;
    }
  }

  // Sync TrainingSession directly to database (convenience method)
  static async syncTrainingSession(
    session: TrainingSession, 
    profileId: number,
    endTime?: string
  ): Promise<{ id: number; profile_id: number; session_date: string; status: string }> {
    const request = this.convertTrainingSessionToHistoryRequest(session, profileId, endTime);
    return this.syncSessionHistory(request);
  }
}