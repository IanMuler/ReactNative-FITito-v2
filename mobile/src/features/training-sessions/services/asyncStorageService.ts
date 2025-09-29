import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingSession, CreateTrainingSessionRequest, UpdateSetProgressRequest, TrainingSessionExercise, PerformedSet } from '../types';
import { SessionHistoryApi } from './sessionHistoryApi';

const STORAGE_KEYS = {
  ACTIVE_SESSION: (profileId: number) => `@training_session:active_${profileId}`,
} as const;

export class TrainingSessionAsyncStorage {
  // Generate UUID for local sessions
  private static generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateExerciseId(): string {
    return `exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get active session for a specific profile
  static async getActiveSession(profileId: number): Promise<TrainingSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION(profileId));
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as TrainingSession;
      console.log('📱 [AsyncStorage] Retrieved active session:', {
        id: session.id,
        profile_id: session.profile_id,
        routine_name: session.routine_name,
        day_name: session.day_name,
        status: session.status,
        exercises_count: session.exercises.length,
        current_exercise_index: session.current_exercise_index
      });

      return session;
    } catch (error) {
      console.error('❌ Error getting active session from AsyncStorage:', error);
      return null;
    }
  }

  // Create new training session
  static async createSession(request: CreateTrainingSessionRequest): Promise<TrainingSession> {
    try {
      const now = new Date().toISOString();
      
      const session: TrainingSession = {
        id: this.generateId(),
        profile_id: request.profile_id,
        routine_week_id: request.routine_week_id,
        routine_name: request.routine_name,
        day_of_week: request.day_of_week,
        day_name: request.day_name,
        status: 'active',
        current_exercise_index: 0,
        start_time: now,
        last_activity: now,
        created_at: now,
        updated_at: now,
        exercises: request.exercises.map((exercise, index) => ({
          id: this.generateExerciseId(),
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercise_name,
          exercise_image: exercise.exercise_image,
          order_in_session: index + 1,
          sets_config: exercise.sets_config,
          performed_sets: [],
          is_completed: false,
        })),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION(session.profile_id), JSON.stringify(session));
      
      console.log('✅ [AsyncStorage] Created new training session:', {
        id: session.id,
        routine_name: session.routine_name,
        day_name: session.day_name,
        exercises_count: session.exercises.length
      });
      
      return session;
    } catch (error) {
      console.error('❌ Error creating session in AsyncStorage:', error);
      throw new Error('Failed to create training session');
    }
  }

  // Update session
  static async updateSession(sessionId: string, profileId: number, updates: Partial<TrainingSession>): Promise<TrainingSession> {
    try {
      const activeSession = await this.getActiveSession(profileId);
      if (!activeSession || activeSession.id !== sessionId) {
        throw new Error('Session not found or not active');
      }

      const updatedSession: TrainingSession = {
        ...activeSession,
        ...updates,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION(profileId), JSON.stringify(updatedSession));
      
      console.log('✅ [AsyncStorage] Updated session:', {
        id: updatedSession.id,
        status: updatedSession.status,
        current_exercise_index: updatedSession.current_exercise_index
      });
      
      return updatedSession;
    } catch (error) {
      console.error('❌ Error updating session in AsyncStorage:', error);
      throw new Error('Failed to update training session');
    }
  }

  // Update set progress
  static async updateSetProgress(request: UpdateSetProgressRequest, profileId: number): Promise<TrainingSession> {
    try {
      const activeSession = await this.getActiveSession(profileId);
      if (!activeSession || activeSession.id !== request.session_id) {
        throw new Error('Session not found or not active');
      }

      // Find the exercise
      const exerciseIndex = activeSession.exercises.findIndex(ex => ex.exercise_id === request.exercise_id);
      if (exerciseIndex === -1) {
        throw new Error('Exercise not found in session');
      }

      const exercise = activeSession.exercises[exerciseIndex];

      // Find or create the performed set
      let setIndex = exercise.performed_sets.findIndex(set => set.set_number === request.set_number);

      const performedSet: PerformedSet = {
        set_number: request.set_number,
        reps: request.reps,
        weight: request.weight,
        rir: request.rir,
        rest_pause_details: request.rest_pause_details,
        drop_set_details: request.drop_set_details,
        partials_details: request.partials_details,
        notes: request.notes,
      };

      if (setIndex === -1) {
        // Add new set
        exercise.performed_sets.push(performedSet);
      } else {
        // Update existing set
        exercise.performed_sets[setIndex] = performedSet;
      }

      // Update session
      const updatedSession = await this.updateSession(activeSession.id, profileId, {
        exercises: activeSession.exercises,
      });

      console.log('✅ [AsyncStorage] Updated set progress:', {
        exercise_name: exercise.exercise_name,
        set_number: request.set_number,
        reps: request.reps,
        weight: request.weight
      });

      return updatedSession;
    } catch (error) {
      console.error('❌ Error updating set progress in AsyncStorage:', error);
      throw new Error('Failed to update set progress');
    }
  }

  // Move to next exercise
  static async moveToNextExercise(sessionId: string, profileId: number): Promise<TrainingSession> {
    try {
      const activeSession = await this.getActiveSession(profileId);
      if (!activeSession || activeSession.id !== sessionId) {
        throw new Error('Session not found or not active');
      }

      const nextIndex = Math.min(activeSession.current_exercise_index + 1, activeSession.exercises.length - 1);

      return await this.updateSession(sessionId, profileId, {
        current_exercise_index: nextIndex,
      });
    } catch (error) {
      console.error('❌ Error moving to next exercise in AsyncStorage:', error);
      throw new Error('Failed to move to next exercise');
    }
  }

  // Move to previous exercise
  static async moveToPreviousExercise(sessionId: string, profileId: number): Promise<TrainingSession> {
    try {
      const activeSession = await this.getActiveSession(profileId);
      if (!activeSession || activeSession.id !== sessionId) {
        throw new Error('Session not found or not active');
      }

      const prevIndex = Math.max(activeSession.current_exercise_index - 1, 0);

      return await this.updateSession(sessionId, profileId, {
        current_exercise_index: prevIndex,
      });
    } catch (error) {
      console.error('❌ Error moving to previous exercise in AsyncStorage:', error);
      throw new Error('Failed to move to previous exercise');
    }
  }

  // Complete session
  static async completeSession(sessionId: string, profileId: number): Promise<void> {
    try {
      const activeSession = await this.getActiveSession(profileId);
      if (!activeSession || activeSession.id !== sessionId) {
        throw new Error('Session not found or not active');
      }

      const endTime = new Date().toISOString();

      // Update session status to completed
      const completedSession = await this.updateSession(sessionId, profileId, {
        status: 'completed',
      });

      // Sync to database
      try {
        await SessionHistoryApi.syncTrainingSession(completedSession, profileId, endTime);
        console.log('✅ [AsyncStorage] Session synced to database successfully');
      } catch (syncError) {
        console.error('⚠️ [AsyncStorage] Failed to sync to database, but session completed locally:', syncError);
        // Don't throw error - session should still complete locally even if sync fails
      }

      // Clear active session for this profile - history is only in database
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION(profileId));

      console.log('✅ [AsyncStorage] Session completed and synced to database:', {
        id: completedSession.id,
        routine_name: completedSession.routine_name,
        synced_to_db: !!profileId
      });
    } catch (error) {
      console.error('❌ Error completing session in AsyncStorage:', error);
      throw new Error('Failed to complete training session');
    }
  }

  // Cancel session
  static async cancelSession(sessionId: string, profileId: number): Promise<void> {
    try {
      const activeSession = await this.getActiveSession(profileId);
      if (!activeSession || activeSession.id !== sessionId) {
        throw new Error('Session not found or not active');
      }

      // Simply clear the active session for this profile - cancelled sessions are not saved anywhere
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION(profileId));

      console.log('✅ [AsyncStorage] Session cancelled and removed:', {
        id: activeSession.id,
        routine_name: activeSession.routine_name
      });
    } catch (error) {
      console.error('❌ Error cancelling session in AsyncStorage:', error);
      throw new Error('Failed to cancel training session');
    }
  }

  // Pause session
  static async pauseSession(sessionId: string, profileId: number): Promise<TrainingSession> {
    try {
      return await this.updateSession(sessionId, profileId, {
        status: 'paused',
      });
    } catch (error) {
      console.error('❌ Error pausing session in AsyncStorage:', error);
      throw new Error('Failed to pause training session');
    }
  }

  // Resume session
  static async resumeSession(sessionId: string, profileId: number): Promise<TrainingSession> {
    try {
      return await this.updateSession(sessionId, profileId, {
        status: 'active',
      });
    } catch (error) {
      console.error('❌ Error resuming session in AsyncStorage:', error);
      throw new Error('Failed to resume training session');
    }
  }


  // Clear all data (for debugging/reset)
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      console.log('✅ [AsyncStorage] Cleared all training session data');
    } catch (error) {
      console.error('❌ Error clearing AsyncStorage data:', error);
    }
  }
}