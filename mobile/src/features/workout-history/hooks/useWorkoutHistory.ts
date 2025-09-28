/* Workout History Hook - For accessing completed workout sessions */

import { useQuery } from '@tanstack/react-query';
import { workoutHistoryApi } from '../services/workoutHistoryApi';

export const useWorkoutHistory = () => {
  return {
    // Get workout session by date
    useWorkoutByDate: (profileId: number, date: string) => {
      return useQuery({
        queryKey: ['workout-history', 'by-date', profileId, date],
        queryFn: () => workoutHistoryApi.getWorkoutByDate(profileId, date),
        enabled: !!profileId && !!date,
        staleTime: 5 * 60 * 1000, // 5 minutes - workout history doesn't change often
        retry: 1,
      });
    },

    // Get workout sessions list for a profile
    useWorkoutHistory: (profileId: number, options?: { daysBack?: number; limit?: number }) => {
      return useQuery({
        queryKey: ['workout-history', 'list', profileId, options],
        queryFn: () => workoutHistoryApi.getWorkoutHistory(profileId, options),
        enabled: !!profileId,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 1,
      });
    },
  };
};