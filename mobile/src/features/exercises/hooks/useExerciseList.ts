import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { exerciseApi } from '../services';

export const useExerciseList = () => {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  /* Fetch exercises using React Query */
  const { data: exercises = [], isLoading, error } = useQuery({
    queryKey: ['exercises'],
    queryFn: exerciseApi.getAll,
  });

  /* Pull to refresh function */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['exercises'] });
    setRefreshing(false);
  }, [queryClient]);

  return {
    exercises,
    isLoading,
    error,
    refreshing,
    onRefresh,
  };
};