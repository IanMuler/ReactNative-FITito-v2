import NetInfo from '@react-native-community/netinfo';
import { QueryClient } from '@tanstack/react-query';
import { offlineMutationManager, OfflineMutation } from './offlineMutationManager';
import { SessionHistoryApi } from '@/features/training-sessions/services/sessionHistoryApi';
import { SessionHistoryStorage } from '@/features/training-sessions/services/sessionHistoryStorage';
import { routineApi } from '@/features/routines/services/routineApi';

export const backgroundSyncService = {
  queryClient: null as QueryClient | null,

  // Initialize background sync
  initialize: (queryClient: QueryClient) => {
    backgroundSyncService.queryClient = queryClient;

    NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('📡 Network restored, syncing offline changes...');
        await backgroundSyncService.syncPendingMutations();
      }
    });
  },

  // Sync all pending mutations
  syncPendingMutations: async () => {
    const mutations = await offlineMutationManager.getPendingMutations();
    const pending = mutations.filter((m) => !m.isSynced);

    console.log(`🔄 Syncing ${pending.length} pending mutations...`);

    let syncedCount = 0;

    for (const mutation of pending) {
      try {
        await backgroundSyncService.syncMutation(mutation);
        await offlineMutationManager.markMutationSynced(mutation.id);
        console.log(`✅ Synced mutation ${mutation.id}`);
        syncedCount++;

        // Clean up offline storage for session history after successful sync
        if (mutation.type === 'COMPLETE_SESSION' && mutation.payload) {
          try {
            const profileId = mutation.payload.profile_id;
            const sessionDate = mutation.payload.session_date;

            if (profileId && sessionDate) {
              await SessionHistoryStorage.clearOfflineHistory(profileId, sessionDate);
              console.log('🧹 Cleared offline history after sync:', { profileId, sessionDate });
            }
          } catch (cleanupError) {
            console.error('⚠️ Failed to clean offline history:', cleanupError);
            // Don't fail the sync - just log the error
          }
        }
      } catch (error) {
        console.error(`❌ Failed to sync mutation ${mutation.id}:`, error);
        // Will retry on next sync
      }
    }

    // Clean up synced mutations
    await offlineMutationManager.clearSyncedMutations();

    // Invalidate queries after successful sync
    if (syncedCount > 0 && backgroundSyncService.queryClient) {
      console.log('🔄 Invalidating queries after sync...');
      await backgroundSyncService.queryClient.invalidateQueries({ queryKey: ['session-history'] });
      await backgroundSyncService.queryClient.invalidateQueries({ queryKey: ['legacy-workout-history-v2'] });
      console.log('✅ Queries invalidated');
    }
  },

  // Sync individual mutation
  syncMutation: async (mutation: OfflineMutation) => {
    switch (mutation.type) {
      case 'CREATE_SESSION':
        return await SessionHistoryApi.syncSessionHistory(mutation.payload);

      case 'UPDATE_SESSION':
        return await SessionHistoryApi.syncSessionHistory(mutation.payload);

      case 'COMPLETE_SESSION':
        return await SessionHistoryApi.syncSessionHistory(mutation.payload);

      case 'UPDATE_ROUTINE':
        return await routineApi.updateRoutineWeek(
          mutation.payload.routineWeekId,
          mutation.payload.update
        );

      default:
        throw new Error(`Unknown mutation type: ${(mutation as any).type}`);
    }
  },
};
