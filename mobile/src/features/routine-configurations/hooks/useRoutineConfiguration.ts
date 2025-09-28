import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { routineConfigurationApi } from '../services/routineConfigurationApi';
import {
  RoutineDayConfiguration,
  ExerciseConfiguration,
  UpdateRoutineConfigurationDto
} from '../types/routineConfiguration';

export const useRoutineConfiguration = (routineWeekId: number, profileId: number) => {
  const queryClient = useQueryClient();

  // Get configuration
  const {
    data: configuration,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['routine-configuration', routineWeekId, profileId],
    queryFn: () => routineConfigurationApi.getConfiguration(routineWeekId, profileId),
    enabled: !!routineWeekId && !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  // Update configuration mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateRoutineConfigurationDto) =>
      routineConfigurationApi.updateConfiguration(routineWeekId, data),
    onSuccess: (data, variables) => {
      console.log('✅ Configuration save success:', {
        routineWeekId,
        profileId,
        response: data,
        exerciseCount: variables.exercises.length
      });
      
      console.log('🔄 Invalidating configuration query:', ['routine-configuration', routineWeekId, profileId]);
      queryClient.invalidateQueries({ 
        queryKey: ['routine-configuration', routineWeekId, profileId] 
      });
      
      console.log('🔄 Invalidating routine weeks query:', ['routine-weeks', profileId]);
      queryClient.invalidateQueries({ 
        queryKey: ['routine-weeks', profileId] 
      });
      
      Toast.show({
        type: 'success',
        text1: 'Configuración guardada',
        text2: 'Los cambios han sido guardados correctamente',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al guardar',
        text2: error.message || 'No se pudo guardar la configuración',
      });
    },
  });

  // Delete configuration mutation
  const deleteMutation = useMutation({
    mutationFn: () => routineConfigurationApi.deleteConfiguration(routineWeekId, profileId),
    onSuccess: () => {
      console.log('✅ Configuration delete success:', {
        routineWeekId,
        profileId
      });
      
      console.log('🔄 Invalidating configuration query:', ['routine-configuration', routineWeekId, profileId]);
      queryClient.invalidateQueries({ 
        queryKey: ['routine-configuration', routineWeekId, profileId] 
      });
      
      console.log('🔄 Invalidating routine weeks query:', ['routine-weeks', profileId]);
      queryClient.invalidateQueries({ 
        queryKey: ['routine-weeks', profileId] 
      });
      
      Toast.show({
        type: 'success',
        text1: 'Configuración eliminada',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error al eliminar',
        text2: error.message || 'No se pudo eliminar la configuración',
      });
    },
  });

  return {
    // Data
    configuration,
    exercises: configuration?.exercises || [],
    routineWeek: configuration?.routine_week,

    // States
    isLoading: isLoading,
    isSaving: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    error,

    // Actions
    updateConfiguration: (exercises: ExerciseConfiguration[], routineName?: string) =>
      updateMutation.mutate({
        profile_id: profileId,
        routine_name: routineName,
        exercises: exercises.map(exercise => ({
          exercise_id: exercise.exercise_id,
          sets_config: exercise.sets_config,
          notes: exercise.notes,
        })),
      }),

    deleteConfiguration: () => deleteMutation.mutate(),
    
    refetch,
  };
};