import AsyncStorage from '@react-native-async-storage/async-storage';
import { DetailedSessionHistoryResponse } from './sessionHistoryApi';

const STORAGE_KEYS = {
  OFFLINE_HISTORY: (profileId: number, date: string) => `@session_history:offline_${profileId}_${date}`,
  OFFLINE_HISTORIES_PREFIX: (profileId: number) => `@session_history:offline_${profileId}_`,
} as const;

/**
 * AsyncStorage service for offline session history
 * Stores completed sessions locally when offline
 */
export class SessionHistoryStorage {

  /**
   * Save completed session to local storage when offline
   */
  static async saveOfflineHistory(
    profileId: number,
    date: string, // YYYY-MM-DD format
    sessionHistory: DetailedSessionHistoryResponse
  ): Promise<void> {
    try {
      const storageKey = STORAGE_KEYS.OFFLINE_HISTORY(profileId, date);
      await AsyncStorage.setItem(storageKey, JSON.stringify(sessionHistory));

      console.log('📴 [SessionHistoryStorage] Saved offline history:', {
        profile_id: profileId,
        date,
        session_uuid: sessionHistory.session_uuid,
      });
    } catch (error) {
      console.error('❌ [SessionHistoryStorage] Error saving offline history:', error);
      throw new Error('Failed to save offline session history');
    }
  }

  /**
   * Get offline session history for a specific date
   */
  static async getOfflineHistory(
    profileId: number,
    date: string // YYYY-MM-DD format
  ): Promise<DetailedSessionHistoryResponse | null> {
    try {
      const storageKey = STORAGE_KEYS.OFFLINE_HISTORY(profileId, date);
      const data = await AsyncStorage.getItem(storageKey);

      if (!data) {
        return null;
      }

      const history = JSON.parse(data) as DetailedSessionHistoryResponse;

      console.log('📱 [SessionHistoryStorage] Retrieved offline history:', {
        profile_id: profileId,
        date,
        session_uuid: history.session_uuid,
      });

      return history;
    } catch (error) {
      console.error('❌ [SessionHistoryStorage] Error getting offline history:', error);
      return null;
    }
  }

  /**
   * Get all offline session histories for a profile
   */
  static async getAllOfflineHistories(
    profileId: number
  ): Promise<DetailedSessionHistoryResponse[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const prefix = STORAGE_KEYS.OFFLINE_HISTORIES_PREFIX(profileId);
      const offlineHistoryKeys = allKeys.filter(key => key.startsWith(prefix));

      if (offlineHistoryKeys.length === 0) {
        return [];
      }

      const results = await AsyncStorage.multiGet(offlineHistoryKeys);
      const histories: DetailedSessionHistoryResponse[] = [];

      for (const [key, value] of results) {
        if (value) {
          try {
            const history = JSON.parse(value) as DetailedSessionHistoryResponse;
            histories.push(history);
          } catch (parseError) {
            console.error(`❌ [SessionHistoryStorage] Error parsing history for key ${key}:`, parseError);
          }
        }
      }

      console.log('📱 [SessionHistoryStorage] Retrieved all offline histories:', {
        profile_id: profileId,
        count: histories.length,
      });

      return histories;
    } catch (error) {
      console.error('❌ [SessionHistoryStorage] Error getting all offline histories:', error);
      return [];
    }
  }

  /**
   * Clear offline history after successful sync
   */
  static async clearOfflineHistory(
    profileId: number,
    date: string
  ): Promise<void> {
    try {
      const storageKey = STORAGE_KEYS.OFFLINE_HISTORY(profileId, date);
      await AsyncStorage.removeItem(storageKey);

      console.log('🧹 [SessionHistoryStorage] Cleared synced offline history:', {
        profile_id: profileId,
        date,
      });
    } catch (error) {
      console.error('❌ [SessionHistoryStorage] Error clearing offline history:', error);
      throw error;
    }
  }

  /**
   * Clear all offline histories for a profile (for debugging/reset)
   */
  static async clearAllOfflineHistories(profileId: number): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const prefix = STORAGE_KEYS.OFFLINE_HISTORIES_PREFIX(profileId);
      const offlineHistoryKeys = allKeys.filter(key => key.startsWith(prefix));

      if (offlineHistoryKeys.length > 0) {
        await AsyncStorage.multiRemove(offlineHistoryKeys);
      }

      console.log('🧹 [SessionHistoryStorage] Cleared all offline histories:', {
        profile_id: profileId,
        cleared_count: offlineHistoryKeys.length,
      });
    } catch (error) {
      console.error('❌ [SessionHistoryStorage] Error clearing all offline histories:', error);
      throw error;
    }
  }
}
