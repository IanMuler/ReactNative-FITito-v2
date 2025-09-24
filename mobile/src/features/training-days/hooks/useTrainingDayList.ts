import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingDayApi } from '../services';
import { useProfile } from '@/features/profile';

export const useTrainingDayList = () => {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { currentProfile } = useProfile();

  /* Fetch training days using React Query */
  const { data: trainingDays = [], isLoading, error } = useQuery({
    queryKey: ['trainingDays', currentProfile?.id],
    queryFn: () => trainingDayApi.getAllByProfile(currentProfile!.id),
    enabled: !!currentProfile,
  });

  /* Pull to refresh function */
  const onRefresh = useCallback(async () => {
    if (!currentProfile) return;
    setRefreshing(true);
    await queryClient.invalidateQueries({ 
      queryKey: ['trainingDays', currentProfile.id] 
    });
    setRefreshing(false);
  }, [queryClient, currentProfile]);

  return {
    trainingDays,
    isLoading,
    error,
    refreshing,
    onRefresh,
  };
};