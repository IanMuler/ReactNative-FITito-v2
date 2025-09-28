/* Workout History API Service */

import { WorkoutSession, WorkoutHistoryOptions } from '../types';

const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

export const workoutHistoryApi = {
  // Get workout session by specific date
  getWorkoutByDate: async (profileId: number, date: string): Promise<WorkoutSession | null> => {
    console.log('📅 [API] Getting workout history for date:', { profileId, date });
    
    const response = await fetch(
      `${API_BASE_URL}/workout-sessions/by-date?profile_id=${profileId}&date=${date}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [API] Failed to get workout by date:', error);
      throw new Error(error.message || 'Failed to get workout history by date');
    }
    
    const result = await response.json();
    console.log('✅ [API] Workout history by date:', result.data ? 'Found' : 'Not found');
    
    return result.data;
  },

  // Get workout sessions history list
  getWorkoutHistory: async (
    profileId: number, 
    options?: WorkoutHistoryOptions
  ): Promise<WorkoutSession[]> => {
    console.log('📚 [API] Getting workout history list:', { profileId, options });
    
    const params = new URLSearchParams({
      profile_id: profileId.toString(),
      ...(options?.daysBack && { days_back: options.daysBack.toString() }),
      ...(options?.limit && { limit: options.limit.toString() }),
    });
    
    const response = await fetch(`${API_BASE_URL}/workout-sessions?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [API] Failed to get workout history:', error);
      throw new Error(error.message || 'Failed to get workout history');
    }
    
    const result = await response.json();
    console.log('✅ [API] Workout history list:', `${result.data.length} sessions`);
    
    return result.data;
  },
};