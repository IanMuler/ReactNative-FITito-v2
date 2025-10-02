/* Legacy History Hook - Replicates original AsyncStorage behavior */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legacyHistoryApi } from '../services';
import { HistoryEntry } from '../types';
import { SessionHistoryApi } from '@/features/training-sessions/services/sessionHistoryApi';
import Toast from 'react-native-toast-message';

export const useLegacyHistory = (profileId: number, date: string) => {
  const queryClient = useQueryClient();

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

  /* Delete today's history mutation */
  const deleteTodayHistoryMutation = useMutation({
    mutationFn: async (dateToDelete: string) => {
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = dateToDelete.split('/');
      const formattedDate = `${year}-${month}-${day}`;

      return SessionHistoryApi.deleteTodaySessionHistory(profileId, formattedDate);
    },
    onSuccess: () => {
      // Invalidate history queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['legacy-workout-history-v2'] });
      queryClient.invalidateQueries({ queryKey: ['routine-weeks'] });

      Toast.show({
        type: 'success',
        text1: 'Histórico borrado',
        text2: 'El histórico de hoy ha sido eliminado correctamente',
      });

      console.log('✅ [LEGACY-HOOK] Today\'s history deleted successfully');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al borrar',
        text2: error.message || 'No se pudo eliminar el histórico',
      });

      console.error('❌ [LEGACY-HOOK] Failed to delete today\'s history:', error.message);
    }
  });

  /* Delete history by date mutation (any date) */
  const deleteHistoryMutation = useMutation({
    mutationFn: async (dateToDelete: string) => {
      // Convert date format from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = dateToDelete.split('/');
      const formattedDate = `${year}-${month}-${day}`;

      return SessionHistoryApi.deleteSessionHistoryByDate(profileId, formattedDate);
    },
    onSuccess: () => {
      // Invalidate history queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['legacy-workout-history-v2'] });
      queryClient.invalidateQueries({ queryKey: ['session-history'] });

      Toast.show({
        type: 'success',
        text1: 'Histórico borrado',
        text2: 'El histórico ha sido eliminado correctamente',
      });

      console.log('✅ [LEGACY-HOOK] History deleted successfully');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al borrar',
        text2: error.message || 'No se pudo eliminar el histórico',
      });

      console.error('❌ [LEGACY-HOOK] Failed to delete history:', error.message);
    }
  });

  /* Derived data - mimics original filtering logic */
  const dayHistory = historyData.filter((entry: HistoryEntry) => entry.date === date);

  return {
    /* Data */
    dayHistory, // Add this for backward compatibility
    history: dayHistory,
    allHistory: historyData,

    /* States */
    isLoading,
    error,
    isDeleting: deleteTodayHistoryMutation.isPending || deleteHistoryMutation.isPending,

    /* Actions */
    refetch,
    deleteTodayHistory: deleteTodayHistoryMutation.mutate,
    deleteHistory: deleteHistoryMutation.mutate,
  };
};