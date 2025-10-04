/* Workout History API Service */

import { WorkoutSession, WorkoutHistoryOptions } from '../types';
import { fetchHandler } from '@/services/fetchHandler';

export const workoutHistoryApi = {
  // Get workout session by specific date
  getWorkoutByDate: async (profileId: number, date: string): Promise<WorkoutSession | null> => {
    console.log('📅 [API] Getting workout history for date:', { profileId, date });

    try {
      const result = await fetchHandler.get<WorkoutSession | null>('/workout-sessions/by-date', {
        profile_id: profileId.toString(),
        date: date
      });

      console.log('✅ [API] Workout history by date:', result ? 'Found' : 'Not found');
      return result;
    } catch (error) {
      console.error('❌ [API] Failed to get workout by date:', error);
      throw error;
    }
  },

  // Get workout sessions history list
  getWorkoutHistory: async (
    profileId: number,
    options?: WorkoutHistoryOptions
  ): Promise<WorkoutSession[]> => {
    console.log('📚 [API] Getting workout history list:', { profileId, options });

    try {
      const params: Record<string, string> = {
        profile_id: profileId.toString(),
      };

      if (options?.daysBack) {
        params.days_back = options.daysBack.toString();
      }
      if (options?.limit) {
        params.limit = options.limit.toString();
      }

      const result = await fetchHandler.get<WorkoutSession[]>('/workout-sessions', params);

      console.log('✅ [API] Workout history list:', `${result.length} sessions`);
      return result;
    } catch (error) {
      console.error('❌ [API] Failed to get workout history:', error);
      throw error;
    }
  },
};