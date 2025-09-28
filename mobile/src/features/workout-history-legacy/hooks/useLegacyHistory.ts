/* Legacy History Hook - Replicates original AsyncStorage behavior */

import { useQuery } from '@tanstack/react-query';
import { legacyHistoryApi } from '../services';
import { HistoryEntry } from '../types';

export const useLegacyHistory = (profileId: number, date: string) => {
  console.log(`🔍 [LEGACY-HOOK] Initializing history hook for profile ${profileId}, date: ${date}`);

  /* Request hook using TanStack Query */
  const {
    data: historyData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['legacy-workout-history-v2', profileId, date], // Changed key to invalidate cache
    queryFn: () => legacyHistoryApi.getHistoryByDate(profileId, date),
    enabled: !!profileId && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 2,
    onSuccess: (data) => {
      console.log(`✅ [LEGACY-HOOK] History loaded successfully:`, {
        entriesCount: data.length,
        exercisesTotal: data.reduce((total, entry) => total + entry.exerciseDetails.length, 0)
      });
    },
    onError: (error: any) => {
      console.error(`❌ [LEGACY-HOOK] Failed to load history:`, error.message);
    }
  });

  /* Derived data - mimics original filtering logic */
  const dayHistory = historyData.filter((entry: HistoryEntry) => entry.date === date);
  
  console.log(`📅 [LEGACY-HOOK] Filtered day history for ${date}:`, {
    totalEntries: historyData.length,
    dayEntries: dayHistory.length,
    exercisesCount: dayHistory.reduce((total, entry) => total + entry.exerciseDetails.length, 0)
  });

  return {
    /* Data */
    dayHistory, // Add this for backward compatibility
    history: dayHistory,
    allHistory: historyData,
    
    /* States */
    isLoading,
    error,
    
    /* Actions */
    refetch,
  };
};