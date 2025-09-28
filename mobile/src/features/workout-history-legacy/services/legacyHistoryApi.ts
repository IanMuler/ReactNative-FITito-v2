/* Legacy History API Service - Uses AsyncStorage-compatible endpoint */

import { HistoryEntry, LegacyHistoryResponse } from '../types';

const API_BASE_URL = 'http://192.168.1.50:3000/api/v1';

export const legacyHistoryApi = {
  /* Get workout history by date in AsyncStorage format */
  getHistoryByDate: async (profileId: number, date: string): Promise<HistoryEntry[]> => {
    console.log(`📚 [LEGACY-API] Getting workout history for profile ${profileId} on ${date}`);
    
    // Encode date for URL (DD/MM/YYYY -> DD%2FMM%2FYYYY)
    const encodedDate = encodeURIComponent(date);
    
    const response = await fetch(
      `${API_BASE_URL}/workout-history/${profileId}/${encodedDate}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [LEGACY-API] Failed to get workout history:', error);
      throw new Error(error.message || 'Failed to get workout history');
    }
    
    const result: LegacyHistoryResponse = await response.json();
    console.log(`✅ [LEGACY-API] Workout history loaded:`, {
      success: result.success,
      entriesCount: result.data.length,
      exercisesCount: result.data.reduce((total, entry) => total + entry.exerciseDetails.length, 0)
    });
    
    return result.data;
  },
};