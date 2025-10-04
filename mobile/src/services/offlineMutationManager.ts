import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export interface OfflineMutation {
  id: string;
  type: 'CREATE_SESSION' | 'UPDATE_SESSION' | 'COMPLETE_SESSION' | 'UPDATE_ROUTINE';
  payload: any;
  timestamp: string;
  isSynced: boolean;
  retryCount: number;
}

const OFFLINE_MUTATIONS_KEY = '@fitito_offline_mutations';

export const offlineMutationManager = {
  // Queue a mutation for later sync
  queueMutation: async (type: OfflineMutation['type'], payload: any): Promise<string> => {
    const mutation: OfflineMutation = {
      id: uuidv4(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      isSynced: false,
      retryCount: 0,
    };

    const existing = await offlineMutationManager.getPendingMutations();
    const updated = [...existing, mutation];
    await AsyncStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(updated));

    return mutation.id;
  },

  // Get all pending mutations
  getPendingMutations: async (): Promise<OfflineMutation[]> => {
    const data = await AsyncStorage.getItem(OFFLINE_MUTATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Mark mutation as synced
  markMutationSynced: async (mutationId: string): Promise<void> => {
    const mutations = await offlineMutationManager.getPendingMutations();
    const updated = mutations.map((m) =>
      m.id === mutationId ? { ...m, isSynced: true } : m
    );
    await AsyncStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(updated));
  },

  // Remove synced mutations
  clearSyncedMutations: async (): Promise<void> => {
    const mutations = await offlineMutationManager.getPendingMutations();
    const pending = mutations.filter((m) => !m.isSynced);
    await AsyncStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(pending));
  },

  // Get unsynced count
  getUnsyncedCount: async (): Promise<number> => {
    const mutations = await offlineMutationManager.getPendingMutations();
    return mutations.filter((m) => !m.isSynced).length;
  },
};
